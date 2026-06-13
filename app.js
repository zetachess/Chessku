const pieceMap = {
  1: "wP",
  2: "wN",
  3: "wB",
  4: "wR",
  5: "wQ",
  6: "wK",
  7: "bP",
  8: "bN",
  9: "bB"
};

const pieceNames = {
  1: "Peon blanco",
  2: "Caballo blanco",
  3: "Alfil blanco",
  4: "Torre blanca",
  5: "Dama blanca",
  6: "Rey blanco",
  7: "Peon negro",
  8: "Caballo negro",
  9: "Alfil negro"
};

const gameState = {
  dateKey: "",
  dayNumber: 0,
  board: [],
  puzzle: [],
  solution: [],
  selectedCell: null,
  selectedNumber: null,
  moves: 0,
  solved: false,
  timer: null,
  rng: Math.random
};

function renderValue(value) {
  if (!value) return "";
  return `<img class="sudoku-piece" src="assets/pieces/${pieceMap[value]}.svg" alt="${pieceNames[value]}">`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumber(dateKey) {
  const start = new Date("2026-06-13T00:00:00");
  const current = new Date(`${dateKey}T00:00:00`);
  return Math.floor((current - start) / 86400000) + 1;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function startDailyGame() {
  gameState.dateKey = todayKey();
  gameState.dayNumber = dayNumber(gameState.dateKey);
  gameState.rng = mulberry32(hashString(`chessku-${gameState.dateKey}`));
  document.getElementById("dailyLabel").textContent = `Diario #${gameState.dayNumber}`;

  generatePuzzle();
  restoreProgress();
  createBoard();
  createPiecePad();
  updateDisplay();
  startCountdown();
}

function generatePuzzle() {
  const size = 9;
  gameState.solution = Array.from({ length: size }, () => Array(size).fill(0));
  solveSudoku(gameState.solution, size);
  gameState.puzzle = gameState.solution.map((row) => [...row]);

  const cells = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push([row, col]);
    }
  }
  shuffleArray(cells);

  for (let i = 0; i < 46; i++) {
    const [row, col] = cells[i];
    gameState.puzzle[row][col] = 0;
  }

  gameState.board = gameState.puzzle.map((row) => [...row]);
}

function solveSudoku(board, size) {
  function isValid(row, col, num) {
    for (let i = 0; i < size; i++) {
      if (board[row][i] === num || board[i][col] === num) return false;
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function solve() {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 0) {
          const numbers = Array.from({ length: size }, (_, index) => index + 1);
          shuffleArray(numbers);
          for (const num of numbers) {
            if (isValid(row, col, num)) {
              board[row][col] = num;
              if (solve()) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(gameState.rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createBoard() {
  const table = document.getElementById("sudokuTable");
  table.innerHTML = "";

  for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
    const row = table.insertRow();
    for (let colIndex = 0; colIndex < 9; colIndex++) {
      const cell = row.insertCell();
      const value = gameState.board[rowIndex][colIndex];
      cell.className = "sudoku-cell";
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.innerHTML = renderValue(value);

      if (gameState.puzzle[rowIndex][colIndex] !== 0) {
        cell.classList.add("pre-filled");
      } else {
        cell.addEventListener("click", () => selectCell(cell));
      }
    }
  }
}

function createPiecePad() {
  const pad = document.getElementById("piecePad");
  pad.innerHTML = "";
  for (let value = 1; value <= 9; value++) {
    const button = document.createElement("button");
    button.className = "piece-btn";
    button.type = "button";
    button.dataset.value = value;
    button.innerHTML = renderValue(value);
    button.title = `${value}: ${pieceNames[value]}`;
    button.addEventListener("click", () => {
      selectPiece(value);
      placeNumber(value);
    });
    pad.appendChild(button);
  }
}

function selectCell(cell) {
  if (gameState.solved) return;
  document.querySelectorAll(".sudoku-cell").forEach((item) => item.classList.remove("selected"));
  cell.classList.add("selected");
  gameState.selectedCell = cell;
  setStatus(gameState.selectedNumber ? "Coloca la pieza" : "Elige una pieza");
}

function selectPiece(number) {
  if (gameState.solved) return;
  gameState.selectedNumber = number;
  document.querySelectorAll(".piece-btn").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.value) === number);
  });
}

function placeNumber(number) {
  if (!gameState.selectedCell || gameState.solved) return;

  const row = Number(gameState.selectedCell.dataset.row);
  const col = Number(gameState.selectedCell.dataset.col);
  gameState.board[row][col] = number;
  gameState.selectedCell.innerHTML = renderValue(number);
  gameState.selectedCell.classList.remove("error");
  gameState.selectedCell.classList.add("placed");
  gameState.moves++;

  if (gameState.solution[row][col] !== number) {
    gameState.selectedCell.classList.add("error");
    setStatus("Esa pieza no va ahi");
  } else {
    setStatus("Bien");
  }

  setTimeout(() => gameState.selectedCell?.classList.remove("placed"), 220);
  saveProgress();
  updateDisplay();
  checkWin();
}

function clearCell() {
  if (!gameState.selectedCell || gameState.solved) return;
  const row = Number(gameState.selectedCell.dataset.row);
  const col = Number(gameState.selectedCell.dataset.col);
  gameState.board[row][col] = 0;
  gameState.selectedCell.innerHTML = "";
  gameState.selectedCell.classList.remove("error");
  gameState.moves++;
  saveProgress();
  updateDisplay();
  setStatus("Borrado");
}

function checkWin() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (gameState.board[row][col] !== gameState.solution[row][col]) return false;
    }
  }

  gameState.solved = true;
  saveProgress();
  setStatus("Completado");
  document.getElementById("winText").textContent = `Chessku #${gameState.dayNumber} en ${gameState.moves} movimientos.`;
  document.getElementById("winModal").classList.add("open");
  return true;
}

function updateDisplay() {
  document.getElementById("movesDisplay").textContent = gameState.moves;
}

function setStatus(message) {
  document.getElementById("statusLine").textContent = message;
}

function storageKey() {
  return `chessku-${gameState.dateKey}`;
}

function saveProgress() {
  const payload = {
    board: gameState.board,
    moves: gameState.moves,
    solved: gameState.solved
  };
  localStorage.setItem(storageKey(), JSON.stringify(payload));
}

function restoreProgress() {
  const raw = localStorage.getItem(storageKey());
  if (!raw) {
    gameState.moves = 0;
    gameState.solved = false;
    return;
  }

  try {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.board)) gameState.board = saved.board;
    gameState.moves = Number(saved.moves) || 0;
    gameState.solved = Boolean(saved.solved);
  } catch {
    gameState.moves = 0;
    gameState.solved = false;
  }
}

function startCountdown() {
  if (gameState.timer) clearInterval(gameState.timer);
  updateCountdown();
  gameState.timer = setInterval(() => {
    if (todayKey() !== gameState.dateKey) {
      startDailyGame();
      return;
    }
    updateCountdown();
  }, 1000);
}

function updateCountdown() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = Math.max(0, next - now);
  const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  document.getElementById("countdown").textContent = `Nuevo Chessku en ${hours}:${minutes}:${seconds}`;
}

function shareText() {
  const state = gameState.solved ? `${gameState.moves} movs` : "en progreso";
  return `Chessku #${gameState.dayNumber} ${state}\n${window.location.href}`;
}

async function shareDaily() {
  const text = shareText();
  if (navigator.share) {
    await navigator.share({ text });
    return;
  }
  await navigator.clipboard.writeText(text);
  setStatus("Copiado");
}

document.getElementById("clearBtn").addEventListener("click", clearCell);
document.getElementById("shareBtn").addEventListener("click", shareDaily);
document.getElementById("modalShareBtn").addEventListener("click", shareDaily);
document.getElementById("closeModalBtn").addEventListener("click", () => {
  document.getElementById("winModal").classList.remove("open");
});

document.addEventListener("keydown", (event) => {
  if (/^[1-9]$/.test(event.key)) {
    selectPiece(Number(event.key));
    placeNumber(Number(event.key));
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    clearCell();
  }
});

startDailyGame();
