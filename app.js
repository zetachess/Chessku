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
  playerName: "",
  boardSize: 81,
  difficulty: "medium",
  board: [],
  solution: [],
  selectedCell: null,
  selectedNumber: null,
  startTime: null,
  pausedTime: 0,
  moves: 0,
  hints: 3,
  gameTimer: null,
  isPaused: false
};

function renderValue(value) {
  if (!value) return "";
  return `<img class="sudoku-piece" src="assets/pieces/${pieceMap[value]}.svg" alt="${pieceNames[value]}">`;
}

function setStatus(message) {
  document.getElementById("statusLine").textContent = message;
}

function initBackgroundAnimation() {
  const container = document.getElementById("backgroundAnimation");
  container.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const value = (i % 9) + 1;
    const piece = document.createElement("img");
    piece.className = "floating-piece";
    piece.src = `assets/pieces/${pieceMap[value]}.svg`;
    piece.alt = "";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 10}s`;
    piece.style.animationDuration = `${8 + Math.random() * 8}s`;
    container.appendChild(piece);
  }
}

document.querySelectorAll(".level-option").forEach((option) => {
  option.addEventListener("click", function () {
    document.querySelectorAll(".level-option").forEach((opt) => opt.classList.remove("selected"));
    this.classList.add("selected");
    gameState.difficulty = this.dataset.level;
  });
});

document.addEventListener("keydown", (event) => {
  if (gameState.isPaused || document.getElementById("gameScreen").style.display !== "block") return;

  if (/^[1-9]$/.test(event.key)) {
    selectPiece(Number(event.key));
    placeNumber(Number(event.key));
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    clearCell();
  }
});

function startGame() {
  const playerNameInput = document.getElementById("playerName");
  gameState.playerName = playerNameInput.value.trim() || "Jugador";
  gameState.boardSize = 81;

  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  document.getElementById("playerDisplay").textContent = gameState.playerName;

  initializeGame();
}

function initializeGame() {
  gameState.moves = 0;
  gameState.hints = 3;
  gameState.startTime = Date.now();
  gameState.pausedTime = 0;
  gameState.isPaused = false;
  gameState.selectedCell = null;
  gameState.selectedNumber = null;

  document.getElementById("pauseBtn").textContent = "Pausa";
  document.getElementById("pauseModal").style.display = "none";

  generatePuzzle();
  createGameBoard();
  createNumberPad();
  startTimer();
  updateDisplay();
  setStatus("Elige una pieza");
}

function generatePuzzle() {
  const size = Math.sqrt(gameState.boardSize);
  gameState.board = [];
  gameState.solution = [];

  for (let row = 0; row < size; row++) {
    gameState.board[row] = [];
    gameState.solution[row] = [];
    for (let col = 0; col < size; col++) {
      gameState.board[row][col] = 0;
      gameState.solution[row][col] = 0;
    }
  }

  solveSudoku(gameState.solution, size);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      gameState.board[row][col] = gameState.solution[row][col];
    }
  }

  const difficultySettings = {
    easy: 0.4,
    medium: 0.55,
    hard: 0.7,
    superhard: 0.8
  };

  const cellsToRemove = Math.floor(gameState.boardSize * difficultySettings[gameState.difficulty]);
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (gameState.board[row][col] !== 0) {
      gameState.board[row][col] = 0;
      removed++;
    }
  }
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
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createGameBoard() {
  const table = document.getElementById("sudokuTable");
  table.innerHTML = "";
  const size = Math.sqrt(gameState.boardSize);

  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    const row = table.insertRow();
    for (let colIndex = 0; colIndex < size; colIndex++) {
      const cell = row.insertCell();
      const value = gameState.board[rowIndex][colIndex];
      cell.className = "sudoku-cell";
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.dataset.value = value;
      cell.innerHTML = renderValue(value);

      if (value !== 0) {
        cell.classList.add("pre-filled");
      }

      cell.addEventListener("click", function () {
        if (!gameState.isPaused && !this.classList.contains("pre-filled")) {
          selectCell(this);
        }
      });
    }
  }
}

function createNumberPad() {
  const numberPad = document.getElementById("numberPad");
  numberPad.innerHTML = "";

  for (let value = 1; value <= 9; value++) {
    const button = document.createElement("button");
    button.className = "number-btn";
    button.type = "button";
    button.dataset.value = value;
    button.innerHTML = renderValue(value);
    button.setAttribute("aria-label", pieceNames[value]);
    button.title = `${value}: ${pieceNames[value]}`;
    button.addEventListener("click", () => {
      if (!gameState.isPaused) {
        selectPiece(value);
        placeNumber(value);
      }
    });
    numberPad.appendChild(button);
  }
}

function selectPiece(number) {
  gameState.selectedNumber = number;
  document.querySelectorAll(".number-btn").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.value) === number);
  });
  setStatus(`${pieceNames[number]} seleccionado`);
}

function selectCell(cell) {
  if (gameState.isPaused) return;

  document.querySelectorAll(".sudoku-cell").forEach((candidate) => candidate.classList.remove("selected"));
  cell.classList.add("selected");
  gameState.selectedCell = cell;
  setStatus(gameState.selectedNumber ? `${pieceNames[gameState.selectedNumber]} listo` : "Elige una pieza");
}

function placeNumber(number) {
  if (gameState.isPaused || !gameState.selectedCell || gameState.selectedCell.classList.contains("pre-filled")) {
    return;
  }

  const row = Number(gameState.selectedCell.dataset.row);
  const col = Number(gameState.selectedCell.dataset.col);

  gameState.board[row][col] = number;
  gameState.selectedCell.dataset.value = number;
  gameState.selectedCell.innerHTML = renderValue(number);
  gameState.selectedCell.classList.remove("error");
  gameState.selectedCell.classList.add("placed");
  gameState.moves++;

  if (gameState.solution[row][col] !== number) {
    gameState.selectedCell.classList.add("error");
    setStatus("Esa pieza no va ahi");
    setTimeout(() => {
      gameState.selectedCell?.classList.remove("error");
    }, 800);
  } else {
    setStatus(`${pieceNames[number]} colocada`);
  }

  setTimeout(() => {
    gameState.selectedCell?.classList.remove("placed");
  }, 260);

  updateDisplay();
  checkWin();
}

function clearCell() {
  if (gameState.isPaused || !gameState.selectedCell || gameState.selectedCell.classList.contains("pre-filled")) {
    return;
  }

  const row = Number(gameState.selectedCell.dataset.row);
  const col = Number(gameState.selectedCell.dataset.col);

  gameState.board[row][col] = 0;
  gameState.selectedCell.dataset.value = 0;
  gameState.selectedCell.innerHTML = "";
  gameState.selectedCell.classList.remove("error");
  gameState.moves++;

  setStatus("Casilla vacia");
  updateDisplay();
}

function getHint() {
  if (gameState.isPaused) return;

  if (gameState.hints <= 0) {
    setStatus("No quedan pistas");
    return;
  }

  if (!gameState.selectedCell || gameState.selectedCell.classList.contains("pre-filled")) {
    setStatus("Selecciona una casilla vacia primero");
    return;
  }

  const row = Number(gameState.selectedCell.dataset.row);
  const col = Number(gameState.selectedCell.dataset.col);
  const value = gameState.solution[row][col];

  gameState.board[row][col] = value;
  gameState.selectedCell.dataset.value = value;
  gameState.selectedCell.innerHTML = renderValue(value);
  gameState.selectedCell.classList.add("pre-filled", "hinted");
  gameState.hints--;
  gameState.moves++;

  setStatus(`Pista: ${pieceNames[value]}`);
  updateDisplay();
  checkWin();
}

function checkSolution() {
  if (gameState.isPaused) return;

  const size = Math.sqrt(gameState.boardSize);
  let correct = 0;
  let filled = 0;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (gameState.board[row][col] !== 0) {
        filled++;
        if (gameState.board[row][col] === gameState.solution[row][col]) {
          correct++;
        }
      }
    }
  }

  const percent = Math.round((correct / gameState.boardSize) * 100);
  setStatus(`Progreso: ${correct}/${gameState.boardSize} piezas correctas (${percent}%). ${filled} colocadas.`);
}

function checkWin() {
  if (gameState.isPaused) return false;

  const size = Math.sqrt(gameState.boardSize);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (gameState.board[row][col] !== gameState.solution[row][col]) {
        return false;
      }
    }
  }

  clearInterval(gameState.gameTimer);
  const timeElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  document.getElementById("victoryMessage").innerHTML = `
    <p>${gameState.playerName}, completaste el tablero sin repetir piezas.</p>
    <div class="victory-pieces">${Object.keys(pieceMap).map((value) => renderValue(Number(value))).join("")}</div>
    <p>Tiempo: ${minutes}:${seconds.toString().padStart(2, "0")}</p>
    <p>Movimientos: ${gameState.moves}</p>
    <p>Pistas usadas: ${3 - gameState.hints}</p>
  `;

  document.getElementById("victoryModal").style.display = "flex";
  return true;
}

function togglePause() {
  const pauseBtn = document.getElementById("pauseBtn");
  const pauseModal = document.getElementById("pauseModal");

  if (gameState.isPaused) {
    gameState.isPaused = false;
    gameState.startTime = Date.now() - gameState.pausedTime;
    startTimer();
    pauseBtn.textContent = "Pausa";
    pauseModal.style.display = "none";
    setPausedControls(false);
  } else {
    gameState.isPaused = true;
    gameState.pausedTime = Date.now() - gameState.startTime;
    clearInterval(gameState.gameTimer);
    pauseBtn.textContent = "Continuar";
    pauseModal.style.display = "flex";
    setPausedControls(true);
  }
}

function setPausedControls(paused) {
  document.querySelectorAll(".sudoku-cell").forEach((cell) => {
    cell.style.pointerEvents = paused ? "none" : "auto";
  });
  document.querySelectorAll(".number-btn").forEach((button) => {
    button.disabled = paused;
  });
  document.querySelectorAll(".control-btn").forEach((button) => {
    if (button.id !== "pauseBtn") button.disabled = paused;
  });
}

function startTimer() {
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
  }

  gameState.gameTimer = setInterval(() => {
    if (!gameState.isPaused) {
      const timeElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      document.getElementById("timeDisplay").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
}

function updateDisplay() {
  document.getElementById("movesDisplay").textContent = gameState.moves;
  document.getElementById("hintsDisplay").textContent = gameState.hints;
}

function newGame() {
  document.getElementById("victoryModal").style.display = "none";
  document.getElementById("pauseModal").style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("setupScreen").style.display = "block";

  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
  }

  gameState.isPaused = false;
  gameState.pausedTime = 0;
  document.getElementById("playerName").value = gameState.playerName;
  document.querySelectorAll(".level-option").forEach((opt) => opt.classList.remove("selected"));
  document.querySelector(`[data-level="${gameState.difficulty}"]`).classList.add("selected");
}

initBackgroundAnimation();
