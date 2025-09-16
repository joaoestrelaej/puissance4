const createGameForm = document.getElementById("createGame");
const player1Input = document.getElementById("player1");
const statusDiv = document.getElementById("status");

createGameForm.addEventListener("submit", (e) => {
  e.preventDefault(); 

  const pseudo = player1Input.value.trim();

  if (pseudo === "") {
    alert("Merci d’entrer un pseudo !");
    return;
  }

  statusDiv.textContent = `Bienvenue ${pseudo} 👋. En attente d’un autre joueur...`;

  console.log("Pseudo du joueur 1 :", pseudo);
});

const firebaseConfig = {
  // <script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB-q-IN52l0pOHUdOY3mVNTmhJVDpwMKqc",
    authDomain: "puissance-4-1615e.firebaseapp.com",
    projectId: "puissance-4-1615e",
    storageBucket: "puissance-4-1615e.firebasestorage.app",
    messagingSenderId: "534212183600",
    appId: "1:534212183600:web:c5ca16b99429aaacaa4ff5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>
};

if(!firebaseConfig || !firebaseConfig.apiKey){
  console.error("Tu dois coller ton firebaseConfig dans script.js (voir commentaire).");
}

// Init Firebase
if(window.firebase){
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  /* ----------------- Variables du jeu ----------------- */
  const rows = 6, cols = 7;
  let board = [];                 // matrice 6x7
  let gameId = null;
  let meNum = null;               // 1 ou 2
  let meName = '';
  let opponentName = '';
  let currentPlayer = 1;
  let gameRef = null;
  let gameOver = false;

  /* ---------- Utilitaires URL ---------- */
  function params() {
    return new URLSearchParams(window.location.search);
  }

  function getParam(name){ return params().get(name); }

  /* ---------- Initialisation de la page ---------- */
  const boardDiv = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const gameIdDisplay = document.getElementById('gameIdDisplay');
  const meNameEl = document.getElementById('meName');
  const meNumEl = document.getElementById('meNum');
  const oppNameEl = document.getElementById('opponentName');
  const shareInput = document.getElementById('shareLink');

  // crée l'affichage du plateau (DOM)
  function createLocalBoard(){
    board = Array.from({length:rows}, ()=> Array(cols).fill(0));
    boardDiv.innerHTML = '';
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r; cell.dataset.col = c;
        cell.addEventListener('click', ()=> tryPlay(c));
        boardDiv.appendChild(cell);
      }
    }
    updateBoardUI();
  }

  function updateBoardUI(){
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const idx = r*cols + c;
        const cell = boardDiv.children[idx];
        cell.classList.remove('player1','player2');
        if(board[r][c] === 1) cell.classList.add('player1');
        if(board[r][c] === 2) cell.classList.add('player2');
      }
    }
  }

  function updateStatusText(){
    if(gameOver){
      statusEl.textContent = "Partie terminée.";
      return;
    }
    if(currentPlayer === meNum){
      statusEl.textContent = "C'est ton tour.";
    } else {
      statusEl.textContent = "Tour de l'adversaire...";
    }
  }

  /* ---------- Gestion des coups locaux puis push vers Firebase ---------- */
  function tryPlay(col){
    if(gameOver) return;
    if(currentPlayer !== meNum) return alert("Attends ton tour.");

    // trouve la première case vide en partant du bas
    for(let r=rows-1;r>=0;r--){
      if(board[r][col] === 0){
        // applique localement puis envoie à Firebase
        board[r][col] = meNum;
        pushMoveToFirebase(r, col);
        return;
      }
    }
    // colonne pleine
  }

  function pushMoveToFirebase(r, c){
    if(!gameRef) return;
    const move = {
      row: r,
      col: c,
      player: meNum,
      ts: Date.now()
    };
    // Ecrire le move dans /games/{gameId}/moves en push
    const movesRef = gameRef.child('moves');
    const newMoveRef = movesRef.push();
    newMoveRef.set(move).catch(err => console.error(err));
  }

  /* ---------- Vérifier victoire (côté client aussi) ---------- */
  function checkWinLocal(r, c, boardToCheck){
    const player = boardToCheck[r][c];
    const directions = [[0,1],[1,0],[1,1],[1,-1]];
    for(const [dr,dc] of directions){
      let count = 1;
      count += countDir(r,c,dr,dc,player,boardToCheck);
      count += countDir(r,c,-dr,-dc,player,boardToCheck);
      if(count >= 4) return true;
    }
    return false;
  }
  function countDir(r,c,dr,dc,player,boardToCheck){
    let nr = r+dr, nc = c+dc, cnt=0;
    while(nr>=0 && nr<rows && nc>=0 && nc<cols && boardToCheck[nr][nc] === player){
      cnt++; nr+=dr; nc+=dc;
    }
    return cnt;
  }

  /* ---------- Sync with Firebase ---------- */
  function setupGameSync(gid, creatorNum, pname, opname){
    gameId = gid;
    meNum = Number(creatorNum);
    meName = pname || `Joueur${meNum}`;
    opponentName = opname || (meNum===1? 'Joueur2' : 'Joueur1');

    gameIdDisplay.textContent = gameId;
    meNameEl.textContent = meName;
    meNumEl.textContent = meNum;
    oppNameEl.textContent = opponentName;

    createLocalBoard();
    // référence DB
    gameRef = db.ref('games/' + gameId);

    // Si la partie n'existe pas encore, on l'initialise (créateur)
    gameRef.once('value').then(snapshot=>{
      if(!snapshot.exists()){
        // init structure
        const initial = {
          board: Array(rows).fill(null).map(()=> Array(cols).fill(0)),
          currentPlayer: 1,
          players: { p1: (meNum===1? meName : opponentName), p2: (meNum===2? meName : opponentName) },
          createdAt: Date.now()
        };
        gameRef.set(initial);
      } else {
        // si existe déjà, on tente de remplir les players si p2 manquant
        const data = snapshot.val();
        if(meNum === 2 && (!data.players || !data.players.p2)){
          gameRef.child('players/p2').set(meName);
        }
      }
    });

    // Écoute les changements de la partie
    gameRef.on('value', snap => {
      const data = snap.val();
      if(!data) return;
      // sync board
      if(data.board){
        // certains types (arrays) peuvent revenir null, on protège
        try {
          // ensure correct shape
          for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) board[r][c] = Number(data.board[r][c] || 0);
        } catch(e){
          // fallback
        }
      }
      // sync players names
      if(data.players){
        meNameEl.textContent = (meNum===1 ? data.players.p1 : data.players.p2) || meName;
        oppNameEl.textContent = (meNum===1 ? data.players.p2 : data.players.p1) || opponentName;
      }
      // sync currentPlayer
      currentPlayer = data.currentPlayer || 1;

      updateBoardUI();
      updateStatusText();
    });

    // Écoute les moves en append (pour appliquer moves dans l'ordre)
    const movesRef = gameRef.child('moves');
    movesRef.off(); // sécurité
    movesRef.on('child_added', snap => {
      const mv = snap.val();
      if(!mv) return;
      // applique le move sur le board local si pas déjà appliqué
      const r = mv.row, c = mv.col, p = mv.player;
      if(board[r][c] !== p){
        board[r][c] = p;
        // lorsqu'un move arrive, on met à jour currentPlayer côté DB
        // on calcule si victoire
        const win = checkWinLocal(r,c,board);
        if(win){
          gameRef.update({ board: board, currentPlayer: 0, winner: p });
          gameOver = true;
          statusEl.textContent = `Le joueur ${p} a gagné !`;
        } else {
          const next = (p === 1 ? 2 : 1);
          gameRef.update({ board: board, currentPlayer: next });
        }
        updateBoardUI();
      }
    });
  }

  /* ---------- Fonction partage ---------- */
  document.getElementById('btnShare').addEventListener('click', ()=>{
    if(!gameId) return alert("La partie n'est pas encore initialisée.");
    const url = `${window.location.origin}${window.location.pathname}?game=${gameId}&p=2&pname=${encodeURIComponent(meName)}&opname=${encodeURIComponent(oppNameEl.textContent)}`;
    shareInput.value = url;
    shareInput.select();
    try{ document.execCommand('copy'); alert("Lien copié. Envoie-le à ton collègue."); }
    catch(e){ alert("Copie manuelle : " + url); }
  });

  /* ---------- Reset / Rejouer (débuter nouveau plateau mais même gameId) ---------- */
  document.getElementById('btnRestart').addEventListener('click', ()=>{
    if(!gameRef) return;
    if(!confirm("Remettre le plateau à zéro pour cette partie ?")) return;
    const empty = Array(rows).fill(null).map(()=> Array(cols).fill(0));
    gameRef.update({ board: empty, currentPlayer: 1, winner: null });
    // supprime les moves (facultatif)
    gameRef.child('moves').remove();
    gameOver = false;
  });

  /* ---------- Gestion arrivée sur la page : lecture des params ---------- */
  (function initFromURL(){
    const urlParams = new URLSearchParams(window.location.search);
    const gid = urlParams.get('game');
    const p = urlParams.get('p'); // 1 = créateur, 2 = invité
    const pname = urlParams.get('pname') || '';
    const opname = urlParams.get('opname') || '';

    if(!gid){
      alert("Aucun game id fourni. Retour à l'accueil.");
      window.location.href = 'index.html';
      return;
    }
    // setup sync
    setupGameSync(gid, p || 2, decodeURIComponent(pname), decodeURIComponent(opname));
  })();

} else {
  console.error("Firebase non détecté. Vérifie les scripts dans game.html");
}
