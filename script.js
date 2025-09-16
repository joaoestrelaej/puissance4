import { ref, set, get, onValue, update } from './window.js'; // on utilise ceux exposés via window
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
let playerNumber = 1;
let gameId = null;

// Vérifie si on rejoint via un lien
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
    await set(gameRef, {
      player1: playerPseudo,
      board: Array(6).fill().map(() => Array(7).fill(0))
    });

    statusDiv.textContent = `Bienvenue ${playerPseudo} 👋. Partage ce lien :`;

    const link = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    shareLinkInput.value = link;
    shareLinkSection.style.display = "block";
  }

  createBoard();
});

// Fonction pour rejoindre une partie
function joinGame(gameId) {
  const gameRef = ref(database, 'games/' + gameId);

  // Mettre player2 dans Firebase
  get(gameRef).then(snapshot => {
    const data = snapshot.val();
    if (!data.player2) {
      update(gameRef, { player2: "Joueur2" });
    }
    statusDiv.textContent = `Vous êtes le joueur 2. Partie prête !`;
    createBoard();
  });

  // Écoute les changements en temps réel
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    console.log("Données Firebase :", data);
  });
}

// Générer le plateau vide
function createBoard() {
  boardDiv.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardDiv.appendChild(cell);
    }
  }
}

// Copier le lien
copyLinkBtn.addEventListener("click", () => {
  shareLinkInput.select();
  document.execCommand("copy");
  alert("Lien copié ! Envoie-le à ton collègue.");
});
