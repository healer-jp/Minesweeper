// Minesweeper Game
const ROWS = 9;
const COLS = 9;
const MINES = 10;

let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let gameWon = false;
let firstClick = true;
let timer = 0;
let timerInterval = null;
let minesRemaining = MINES;

// DOM Elements
const gameBoard = document.getElementById('game-board');
const resetBtn = document.getElementById('reset-btn');
const mineCountDisplay = document.getElementById('mine-count');
const timerDisplay = document.getElementById('timer');

// Initialize the game
function initGame() {
    board = [];
    revealed = [];
    flagged = [];
    gameOver = false;
    gameWon = false;
    firstClick = true;
    minesRemaining = MINES;

    // Stop and reset timer
    clearInterval(timerInterval);
    timer = 0;
    timerInterval = null;

    // Update displays
    updateMineCount();
    updateTimer();
    resetBtn.textContent = '😊';

    // Remove win/game-over classes
    gameBoard.classList.remove('win', 'game-over');

    // Initialize arrays
    for (let i = 0; i < ROWS; i++) {
        board[i] = [];
        revealed[i] = [];
        flagged[i] = [];
        for (let j = 0; j < COLS; j++) {
            board[i][j] = 0;
            revealed[i][j] = false;
            flagged[i][j] = false;
        }
    }

    renderBoard();
}

// Place mines after first click (to avoid losing on first click)
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;

    while (minesPlaced < MINES) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);

        // Don't place mine on first click or adjacent cells
        const isNearFirstClick = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;

        if (board[row][col] !== -1 && !isNearFirstClick) {
            board[row][col] = -1; // -1 represents a mine
            minesPlaced++;
        }
    }

    // Calculate numbers
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j] !== -1) {
                board[i][j] = countAdjacentMines(i, j);
            }
        }
    }
}

// Count adjacent mines
function countAdjacentMines(row, col) {
    let count = 0;

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;

            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                if (board[newRow][newCol] === -1) {
                    count++;
                }
            }
        }
    }

    return count;
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell hidden';
            cell.dataset.row = i;
            cell.dataset.col = j;

            // Left click
            cell.addEventListener('click', () => handleClick(i, j));

            // Right click (flag)
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(i, j);
            });

            gameBoard.appendChild(cell);
        }
    }
}

// Handle left click
function handleClick(row, col) {
    if (gameOver || gameWon || flagged[row][col]) {
        return;
    }

    // Chord functionality: if cell is already revealed and has a number
    if (revealed[row][col]) {
        const number = board[row][col];
        if (number > 0) {
            // Count adjacent flags
            let adjacentFlags = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                        if (flagged[newRow][newCol]) {
                            adjacentFlags++;
                        }
                    }
                }
            }

            // If flags match the number, reveal all unflagged adjacent cells
            if (adjacentFlags === number) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newRow = row + i;
                        const newCol = col + j;
                        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                            if (!flagged[newRow][newCol] && !revealed[newRow][newCol]) {
                                revealCell(newRow, newCol);
                            }
                        }
                    }
                }
                checkWin();
            }
        }
        return;
    }

    // First click - place mines and start timer
    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }

    revealCell(row, col);
    checkWin();
}

// Handle right click (flag)
function handleRightClick(row, col) {
    if (gameOver || gameWon || revealed[row][col]) {
        return;
    }

    const cell = getCell(row, col);

    if (flagged[row][col]) {
        // Remove flag
        flagged[row][col] = false;
        cell.classList.remove('flagged');
        minesRemaining++;
    } else {
        // Add flag
        flagged[row][col] = true;
        cell.classList.add('flagged');
        minesRemaining--;
    }

    updateMineCount();
}

// Reveal a cell
function revealCell(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
        return;
    }

    if (revealed[row][col] || flagged[row][col]) {
        return;
    }

    revealed[row][col] = true;
    const cell = getCell(row, col);
    cell.classList.remove('hidden');
    cell.classList.add('revealed');

    if (board[row][col] === -1) {
        // Hit a mine
        cell.classList.add('mine');
        cell.textContent = '💣';
        endGame(false);
        return;
    }

    if (board[row][col] > 0) {
        // Show number
        cell.textContent = board[row][col];
        cell.dataset.number = board[row][col];
    } else {
        // Empty cell - reveal adjacent cells
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) {
                    revealCell(row + i, col + j);
                }
            }
        }
    }
}

// Get cell element
function getCell(row, col) {
    return gameBoard.children[row * COLS + col];
}

// Start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        if (timer > 999) timer = 999;
        updateTimer();
    }, 1000);
}

// Update timer display
function updateTimer() {
    timerDisplay.textContent = timer.toString().padStart(3, '0');
}

// Update mine count display
function updateMineCount() {
    const count = Math.max(0, minesRemaining);
    mineCountDisplay.textContent = count.toString().padStart(3, '0');
}

// Check for win
function checkWin() {
    let revealedCount = 0;

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (revealed[i][j]) {
                revealedCount++;
            }
        }
    }

    // Win if all non-mine cells are revealed
    if (revealedCount === ROWS * COLS - MINES) {
        endGame(true);
    }
}

// End the game
function endGame(won) {
    gameOver = true;
    gameWon = won;
    clearInterval(timerInterval);

    if (won) {
        resetBtn.textContent = '😎';
        gameBoard.classList.add('win');

        // Flag all remaining mines
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (board[i][j] === -1 && !flagged[i][j]) {
                    const cell = getCell(i, j);
                    cell.classList.add('flagged');
                }
            }
        }
        minesRemaining = 0;
        updateMineCount();
    } else {
        resetBtn.textContent = '😵';
        gameBoard.classList.add('game-over');

        // Reveal all mines
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (board[i][j] === -1) {
                    const cell = getCell(i, j);
                    if (!flagged[i][j]) {
                        cell.classList.remove('hidden');
                        cell.classList.add('revealed', 'mine');
                        cell.textContent = '💣';
                    }
                } else if (flagged[i][j]) {
                    // Show wrong flags
                    const cell = getCell(i, j);
                    cell.classList.remove('flagged');
                    cell.textContent = '❌';
                }
            }
        }
    }
}

// Reset button click handler
resetBtn.addEventListener('click', initGame);

// Prevent context menu on game board
gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());

// Initialize game on load
initGame();
