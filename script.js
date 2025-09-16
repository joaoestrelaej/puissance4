import { ref, set, get, onValue, update } from './window.js';
const database = window.database;

// Éléments HTML
const createGameForm = document.getElementById("createGame");
const player1Input = document.getElementById("player1");
const statusDiv = document.getElementById("status");
const boardDiv = document.getElementById("board");
const shareLinkSection = document.getElementById("shareLinkSection");
const shareLinkInput = document.getElementById("shareLink");
const copyLinkBtn = document.getElementById("copyLinkBtn");

let playerPseudo = "";
let playerNumber = 1; // 1 ou 2
let gameId = null;
let currentBoard = [];
let currentTurn = 1; // joueur 1 commence

// Récupère gameId depuis URL si on rejoint
const urlParams = new URLSearchParams(window.location.search);
const urlGameId = urlParams.get('game');

if (urlGameId) {
  gameId = urlGameId;
  playerNumber = 2;
  statusDiv.textContent = "Vous êtes le joueur 2, en attente du plateau...";
  joinGame(gameId);
}

// Création d'une partie
createGameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  playerPseudo = player1Input.value.trim();
  if (!playerPseudo) return alert("Merci d’entrer un pseudo !");

  if (!gameId) {
    gameId = Date.now().toString();
    playerNumber = 1;

    const gameRef = ref(database, 'games/' + gameId);
    currentBoard = Array(6).fill().map(() => Array(7).fill(0));

    await set(gameRef, {
      player1: playerPseudo,
      board: currentBoard,
      turn: 1
    });

    statusDiv.textContent = `Bienvenue ${playerPseudo} 👋. Partage ce lien :`;

    const link = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    shareLinkInput.value = link;
    shareLinkSection.style.display = "block";
  }

  createBoard();
});

// Rejoindre une partie
function joinGame(gameId) {
  const gameRef = ref(database, 'games/' + gameId);

  // Ajouter player2 si vide
  get(gameRef).then(snapshot => {
    const data = snapshot.val();
    if (!data.player2) {
      update(gameRef, { player2: "Joueur2" });
    }
  });

  // Écoute en temps réel
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    currentBoard = data.board;
    currentTurn = data.turn;
    updateBoard();

    if (currentTurn === playerNumber) {
      statusDiv.textContent = "À votre tour !";
    } else {
      statusDiv.textContent = "Tour de l'autre joueur...";
    }
  });
}

// Générer le plateau
function createBoard() {
  boardDiv.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", () => handleClick(r, c));
      boardDiv.appendChild(cell);
    }
  }
  updateBoard();
}

// Met à jour l'affichage du plateau
function updateBoard() {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = boardDiv.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
      cell.classList.remove("player1", "player2");
      if (currentBoard[r][c] === 1) cell.classList.add("player1");
      if (currentBoard[r][c] === 2) cell.classList.add("player2");
    }
  }
}

// Gestion clic
function handleClick(row, col) {
  if (currentTurn !== playerNumber) return; // pas son tour
  // Trouver la ligne la plus basse vide
  for (let r = 5; r >= 0; r--) {
    if (currentBoard[r][col] === 0) {
      currentBoard[r][col] = playerNumber;
      const gameRef = ref(database, 'games/' + gameId);
      update(gameRef, {
        board: currentBoard,
        turn: playerNumber === 1 ? 2 : 1
      });
      checkWin(r, col);
      break;
    }
  }
}

// Vérification victoire
function checkWin(row, col) {
  const player = currentBoard[row][col];
  const directions = [
    [[0,1],[0,-1]], [[1,0],[-1,0]], [[1,1],[-1,-1]], [[1,-1],[-1,1]]
  ];

  for (let dir of directions) {
    let count = 1;
    for (let [dx, dy] of dir) {
      let r = row + dx, c = col + dy;
      while (r >= 0 && r < 6 && c >=0 && c < 7 && currentBoard[r][c] === player) {
        count++;
        r += dx;
        c += dy;
      }
    }
    if (count >= 4) {
      alert(`Joueur ${player} a gagné !`);
      return;
    }
  }
}

// Copier le lien
copyLinkBtn.addEventListener("click", () => {
  shareLinkInput.select();
  document.execCommand("copy");
  alert("Lien copié ! Envoie-le à ton collègue.");
});
