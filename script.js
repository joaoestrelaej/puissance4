console.log("Script chargé ✅");

// Sélection des éléments
const createGameForm = document.getElementById("createGame");
const player1Input = document.getElementById("player1");
const statusDiv = document.getElementById("status");
const boardDiv = document.getElementById("board");

// Variables
let playerPseudo = "";

// Gestion du pseudo
createGameForm.addEventListener("submit", (e) => {
  e.preventDefault();

  playerPseudo = player1Input.value.trim();
  if (!playerPseudo) {
    alert("Merci d’entrer un pseudo !");
    return;
  }

  statusDiv.textContent = `Bienvenue ${playerPseudo} 👋. En attente d’un autre joueur...`;
  console.log("Pseudo du joueur 1 :", playerPseudo);

  // Générer le plateau après avoir choisi le pseudo
  createBoard();
});

// Fonction pour générer le plateau vide
function createBoard() {
  boardDiv.innerHTML = ""; // reset
  const rows = 6;
  const cols = 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardDiv.appendChild(cell);
    }
  }
  statusDiv.textContent += " Plateau prêt !";
}
