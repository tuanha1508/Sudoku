// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBg6UuZhZqKiiKf4bmcnpjkibkdzD8StCk",
    authDomain: "sudoku-c4425.firebaseapp.com",
    databaseURL: "https://sudoku-c4425-default-rtdb.firebaseio.com",
    projectId: "sudoku-c4425",
    storageBucket: "sudoku-c4425.appspot.com",
    messagingSenderId: "161735215527",
    appId: "1:161735215527:web:21f5c65826c7b5320ace82",
    measurementId: "G-PYQTRJ8BED",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let numSelected = null;
let tileSelected = null;
let errors = 0;
let board = [];
let solution = [];
let startTime = null;
let timerInterval = null;
let difficulty = "";
let noteMode = false; // Toggle for note mode
let user = { username: "", streak: 0, lastWinDate: "" };

// Save streak to Firebase
async function saveStreak(username, streak, lastWinDate) {
    await firebase.database().ref(`users/${username}`).set({ streak, lastWinDate });
}

// Retrieve streak from Firebase
async function getStreak(username) {
    const snapshot = await firebase.database().ref(`users/${username}`).get();
    if (snapshot.exists()) {
        return snapshot.val();
    }
    return { streak: 0, lastWinDate: "" };
}

// Toggle Note Mode
document.addEventListener("DOMContentLoaded", () => {
    const noteButton = document.getElementById("toggle-note");
    noteButton.addEventListener("click", () => {
        noteMode = !noteMode;
        noteButton.style.backgroundColor = noteMode ? "#ffa726" : "";
    });
});

// Show Game Page
function showGamePage() {
    document.getElementById("main-page").style.display = "none";
    document.getElementById("game-page").style.display = "block";
}

// Show Main Page
function showMainPage() {
    document.getElementById("main-page").style.display = "block";
    document.getElementById("game-page").style.display = "none";
    clearInterval(timerInterval);
    const elapsedTime = Date.now() - startTime;
    localStorage.setItem("sudokuElapsedTime", elapsedTime);
}

// User Login
// User login and streak reset logic
async function login(username) {
    user.username = username;
    const data = await getStreak(username);

    // Retrieve user's data
    user.streak = data.streak;
    user.lastWinDate = data.lastWinDate;

    const today = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // Yesterday's date

    // Reset streak if the last win date is not today or yesterday
    if (user.lastWinDate !== today && user.lastWinDate !== yesterday) {
        user.streak = 0;
        console.log("Streak reset to 0 due to inactivity.");
    }

    // Save updated streak and last win date to Firebase
    await saveStreak(user.username, user.streak, user.lastWinDate);

    // Update UI
    document.getElementById("welcome-user").innerText = `Welcome, ${user.username}`;
    document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;
    document.getElementById("start-new-game").disabled = false;
    document.getElementById("continue-game").disabled = false;
}


// Fetch Sudoku Board from API
async function fetchSudokuData() {
    try {
        const response = await fetch("https://sudoku-api.vercel.app/api/dosuku");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const apiBoard = data.newboard.grids[0].value;
        const apiSolution = data.newboard.grids[0].solution;
        difficulty = data.newboard.grids[0].difficulty;

        board = apiBoard.map(row => row.map(cell => (cell === 0 ? "-" : cell)).join(""));
        solution = apiSolution.map(row => row.join(""));

        localStorage.setItem("sudokuBoard", JSON.stringify(board));
        localStorage.setItem("sudokuSolution", JSON.stringify(solution));
        localStorage.setItem("sudokuDifficulty", difficulty);

        errors = 0;
        document.getElementById("errors").innerText = errors;

        startTime = Date.now();
        localStorage.setItem("sudokuStartTime", startTime);

        updateTimer();
        setGame();
    } catch (error) {
        alert(`Error fetching the Sudoku board: ${error.message}`);
    }
}

// Continue Last Saved Game
function loadLastGame() {
    const savedBoard = JSON.parse(localStorage.getItem("sudokuBoard"));
    const savedSolution = JSON.parse(localStorage.getItem("sudokuSolution"));
    const savedElapsedTime = localStorage.getItem("sudokuElapsedTime");
    const savedDifficulty = localStorage.getItem("sudokuDifficulty");

    if (savedBoard && savedSolution && savedElapsedTime !== null && savedDifficulty) {
        board = savedBoard;
        solution = savedSolution;
        difficulty = savedDifficulty;

        startTime = Date.now() - savedElapsedTime;
        updateTimer();
        setGame();
    } else {
        alert("No saved game found.");
    }
}

// Update Timer
function updateTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        document.getElementById("timer").innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }, 1000);
}

// Set Up Game
function setGame() {
    showGamePage();

    // Create number buttons
    document.getElementById("digits").innerHTML = ""; // Clear digits
    for (let i = 1; i <= 9; i++) {
        const number = document.createElement("div");
        number.id = i;
        number.innerText = i;
        number.addEventListener("click", selectNumber);
        number.classList.add("number");
        document.getElementById("digits").appendChild(number);
    }

    // Create game board
    document.getElementById("board").innerHTML = ""; // Clear board
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const tile = document.createElement("div");
            tile.id = `${r}-${c}`;
            if (board[r][c] !== "-") {
                tile.innerText = board[r][c];
                tile.classList.add("tile-start");
            }
            if (r === 2 || r === 5) tile.classList.add("horizontal-line");
            if (c === 2 || c === 5) tile.classList.add("vertical-line");

            tile.addEventListener("click", selectTile);
            tile.classList.add("title");
            document.getElementById("board").appendChild(tile);
        }
    }

    // Update game info
    document.getElementById("difficulty").innerText = `Difficulty: ${difficulty}`;
    document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;
}

// Handle Tile Selection
function selectTile() {
    if (numSelected) {
        if (noteMode) {
            addNoteToTile(this, numSelected.id);
        } else {
            if (this.innerText !== "") return;

            const coords = this.id.split("-");
            const r = parseInt(coords[0]);
            const c = parseInt(coords[1]);

            if (solution[r][c] === numSelected.id) {
                this.innerText = numSelected.id;
                this.classList.remove("notes");

                if (checkWin()) {
                    clearInterval(timerInterval);
                    alert("Congratulations! You've completed the Sudoku!");
                    updateStreak();
                    displayWinOptions();
                }
            } else {
                errors += 1;
                document.getElementById("errors").innerText = errors;
            }
        }
    }
}

// Add Note to Tile
function addNoteToTile(tile, note) {
    if (tile.innerText && !tile.classList.contains("notes")) return;

    let notes = tile.dataset.notes ? tile.dataset.notes.split(",") : [];
    if (notes.includes(note)) {
        notes = notes.filter(n => n !== note);
    } else {
        notes.push(note);
    }

    tile.dataset.notes = notes.join(",");
    updateTileNotes(tile, notes);
}

// Update Tile Notes
function updateTileNotes(tile, notes) {
    tile.classList.add("notes");
    tile.innerHTML = "";
    const noteGrid = document.createElement("div");
    noteGrid.classList.add("note-grid");

    for (let i = 1; i <= 9; i++) {
        const noteCell = document.createElement("div");
        noteCell.classList.add("note-cell");
        noteCell.innerText = notes.includes(i.toString()) ? i : "";
        noteGrid.appendChild(noteCell);
    }
    tile.appendChild(noteGrid);
}

// Check Win
function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const tile = document.getElementById(`${r}-${c}`);
            if (tile.innerText != solution[r][c]) return false;
        }
    }
    return true;
}

// Update Streak on Win
function updateStreak() {
    const today = new Date().toISOString().split("T")[0];
    if (user.lastWinDate !== today) {
        user.streak += 1;
        user.lastWinDate = today;
        saveStreak(user.username, user.streak, user.lastWinDate);
    }
    document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
    const username = prompt("Enter your username:");
    if (username) await login(username);
});
// Handle number selection
function selectNumber() {
    if (numSelected != null) {
        numSelected.classList.remove("number-selected"); // Deselect the previously selected number
    }
    numSelected = this; // Set the currently selected number
    numSelected.classList.add("number-selected"); // Highlight the selected number
}

document.getElementById("start-new-game").addEventListener("click", fetchSudokuData);
document.getElementById("continue-game").addEventListener("click", loadLastGame);
document.getElementById("back-to-main").addEventListener("click", showMainPage);
