const rows = 6;
const cols = 7;
let board = [];
let currentPlayer = 1;
let gameOver = false;

const boardDiv = document.getElementById("board");
const status = document.getElementById("status");

function createBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill(0));
  boardDiv.innerHTML = "";
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", () => play(c));
      boardDiv.appendChild(cell);
    }
  }
  updateStatus();
}

function play(col) {
  if (gameOver) return;

  for (let r = rows - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = currentPlayer;
      let cell = boardDiv.children[r * cols + col];
      cell.classList.add(currentPlayer === 1 ? "player1" : "player2");
      
      if (checkWin(r, col)) {
        status.textContent = `Le joueur ${currentPlayer} a gagné !`;
        gameOver = true;
        return;
      }

      currentPlayer = currentPlayer === 1 ? 2 : 1;
      updateStatus();
      return;
    }
  }
}

function updateStatus() {
  status.textContent = `Tour du joueur ${currentPlayer}`;
}

function checkWin(r, c) {
  let directions = [
    [0,1], [1,0], [1,1], [1,-1]
  ];

  for (let [dr, dc] of directions) {
    let count = 1;
    count += countDirection(r, c, dr, dc);
    count += countDirection(r, c, -dr, -dc);
    if (count >= 4) return true;
  }
  return false;
}

function countDirection(r, c, dr, dc) {
  let count = 0;
  let player = board[r][c];
  let nr = r + dr, nc = c + dc;

  while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === player) {
    count++;
    nr += dr;
    nc += dc;
  }
  return count;
}

function restart() {
  gameOver = false;
  currentPlayer = 1;
  createBoard();
}

createBoard();
