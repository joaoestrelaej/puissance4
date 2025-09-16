console.log("Script chargé ✅");

// Sélection des éléments
const createGameForm = document.getElementById("createGame");
const player1Input = document.getElementById("player1");
const statusDiv = document.getElementById("status");
const boardDiv = document.getElementById("board");

// Section partage
const shareLinkSection = document.getElementById("shareLinkSection");
const shareLinkInput = document.getElementById("shareLink");
const copyLinkBtn = document.getElementById("copyLinkBtn");

let playerPseudo = "";

// Fonction pour générer un ID unique pour la partie
function generateGameLink() {
  const gameId = Date.now(); // simple ID basé sur l'heure
  const link = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
  return link;
}

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

// Gestion du formulaire pseudo
createGameForm.addEventListener("submit", (e) => {
  e.preventDefault();

  playerPseudo = player1Input.value.trim();
  if (!playerPseudo) {
    alert("Merci d’entrer un pseudo !");
    return;
  }

  statusDiv.textContent = `Bienvenue ${playerPseudo} 👋. En attente d’un autre joueur...`;

  // Génère le plateau
  createBoard();

  // Génère le lien de partage
  const gameLink = generateGameLink();
  shareLinkInput.value = gameLink;
  shareLinkSection.style.display = "block";

  console.log("Pseudo du joueur 1 :", playerPseudo);
  console.log("Lien de la partie :", gameLink);
});

// Copier le lien
copyLinkBtn.addEventListener("click", () => {
  shareLinkInput.select();
  document.execCommand("copy");
  alert("Lien copié ! Envoie-le à ton collègue.");
});
