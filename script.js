// Firebase Configuration
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

// Globals
let numSelected = null;
let tileSelected = null;
let errors = 0;
let board = [];
let solution = [];
let startTime = null;
let timerInterval = null;
let difficulty = "";
let noteMode = false;
let user = { username: "", streak: 0, lastWinDate: "" };
const username = localStorage.getItem("sudokuUsername") || "Player";

// Ensure the welcome message is updated
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("welcome-user").innerText = `Welcome, ${username}`;
});
function sanitizeUsername(username) {
    return username.trim().toLowerCase(); // Only sanitize when necessary
}

// Show Game Page
function showGamePage() {
    document.getElementById("main-page").style.display = "none";
    document.getElementById("game-page").style.display = "block";
    document.getElementById("toggle-note").style.display = "block";
}

// Show Main Page
function showMainPage() {
    document.getElementById("main-page").style.display = "block";
    document.getElementById("game-page").style.display = "none";
    clearInterval(timerInterval);
    const elapsedTime = Date.now() - startTime;
    document.getElementById("toggle-note").style.display = "none";
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

// Fallback to Default Board
function fallbackToDefaultBoard() {
    board = [
        "53--7----",
        "6--195---",
        "-98----6-",
        "8---6---3",
        "4--8-3--1",
        "7---2---6",
        "-6----28-",
        "---419--5",
        "----8--79",
    ];
    solution = [
        "534678912",
        "672195348",
        "198342567",
        "859761423",
        "426853791",
        "713924856",
        "961537284",
        "287419635",
        "345286179",
    ];
    difficulty = "Fallback";

    localStorage.setItem("sudokuBoard", JSON.stringify(board));
    localStorage.setItem("sudokuSolution", JSON.stringify(solution));
    localStorage.setItem("sudokuDifficulty", difficulty);

    setGame();
}

// Initialize Game
function setGame() {
    showGamePage();
    document.getElementById("digits").innerHTML = "";
    for (let i = 1; i <= 9; i++) {
        const number = document.createElement("div");
        number.id = i;
        number.innerText = i;
        number.addEventListener("click", selectNumber);
        number.classList.add("number");
        document.getElementById("digits").appendChild(number);
    }

    document.getElementById("board").innerHTML = "";
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const tile = document.createElement("div");
            tile.id = `${r}-${c}`;
            tile.classList.add("title");
            if (board[r][c] !== "-") {
                tile.innerText = board[r][c];
                tile.classList.add("tile-start");
            }
            if (r === 2 || r === 5) tile.classList.add("horizontal-line");
            if (c === 2 || c === 5) tile.classList.add("vertical-line");
            tile.addEventListener("click", selectTile);
            document.getElementById("board").appendChild(tile);
        }
    }

    document.getElementById("difficulty").innerText = `Difficulty: ${difficulty}`;
    document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;
}

// Select Number
function selectNumber() {
    if (numSelected) numSelected.classList.remove("number-selected");
    numSelected = this;
    numSelected.classList.add("number-selected");
}

// Handle Tile Selection with Note Mode
function selectTile() {
    if (!numSelected) return; // Ensure a number is selected

    const [r, c] = this.id.split("-").map(Number);

    if (noteMode) {
        // Handle Note Mode
        if (!this.dataset.notes) this.dataset.notes = "";

        const notes = this.dataset.notes.split(",").filter(Boolean);

        if (notes.includes(numSelected.id)) {
            // Remove the note if it already exists
            this.dataset.notes = notes.filter(note => note !== numSelected.id).join(",");
        } else if (notes.length < 5) { // Limit to 5 notes per tile
            // Add the note if it doesn't exist and limit is not exceeded
            notes.push(numSelected.id);
            this.dataset.notes = notes.sort().join(",");
        }

        this.innerText = this.dataset.notes.split(",").join(" ");
        this.classList.add("note-mode"); // Mark as note-mode
    } else {
        // Handle Regular Mode
        if (this.dataset.notes) {
            // Clear notes when switching to normal mode
            this.dataset.notes = "";
            this.classList.remove("note-mode");
        }

        if (this.innerText !== "") {
            // Check if the number is correct
            if (this.innerText !== solution[r][c]) {
                // If incorrect, increment errors and clear the tile
                document.getElementById("errors").innerText = errors; // Update errors in UI
                this.innerText = "";
            } else {
                this.innerText = numSelected.id;
                this.style.fontSize = "20px"; // Ensure normal size
                this.style.color = "black"; // Reset color to default

                board[r] = board[r].split("");
                board[r][c] = numSelected.id;
                board[r] = board[r].join(""); // Do nothing if the number is already correct
                if (checkWin()) handleWin();
            }
        }

        if (solution[r][c] === numSelected.id) {
            this.innerText = numSelected.id;
            this.style.fontSize = "20px"; // Ensure normal size
            this.style.color = "black"; // Reset color to default

            board[r] = board[r].split("");
            board[r][c] = numSelected.id;
            board[r] = board[r].join("");

            // Check if the game is completed
            if (checkWin()) handleWin();
        } else {
            errors++;
            document.getElementById("errors").innerText = errors; // Update errors in UI
            alert("Incorrect number!");
        }
    }
}

// Check Win Condition
function checkWin() {
    return board.every((row, r) => row.split("").every((cell, c) => cell === solution[r][c]));
}

// Handle Win
function handleWin() {
    clearInterval(timerInterval);
    alert("Congratulations! You've completed the Sudoku!");
    updateStreak();
}

// Enable the "Start New Game" button after completing a game
function handleWin() {
    clearInterval(timerInterval);
    alert("Congratulations! You've completed the Sudoku!");
    updateStreak();

    // Re-enable the "Start New Game" button
    document.getElementById("start-new-game").disabled = false;
}

// Fetch Sudoku Board
async function fetchSudokuData() {
    let retries = 3;
    while (retries > 0) {
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
            return;
        } catch (error) {
            retries--;
            if (retries === 0) {
                alert("Failed to fetch the Sudoku board after multiple attempts.");
                fallbackToDefaultBoard();
            }
        }
    }
}

// Update Streak
async function updateStreak() {
    const today = new Date().toISOString().split("T")[0];
    if (user.lastWinDate !== today) {
        user.streak++;
        user.lastWinDate = today;
        await saveStreak(user.username, user.streak, user.lastWinDate);
    }
    document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;
}

async function saveGameStateToFirebase(username) {
    if (!username) {
        console.error("Invalid username provided. Using default.");
        username = "Player";
    }
    const sanitizedUsername = sanitizeUsername(username);
    const gameState = {
        board,
        solution,
        elapsedTime: Date.now() - startTime,
        difficulty,
        timestamp: Date.now(),
    };
    await firebase.database().ref(`users/${sanitizedUsername}/lastGame`).set(gameState);
    console.log("Game state saved to Firebase:", gameState);
}

// Load saved game state
async function loadLastGameFromFirebase(username) {
    const sanitizedUsername = sanitizeUsername(username);
    const snapshot = await firebase.database().ref(`users/${sanitizedUsername}/lastGame`).get();

    if (snapshot.exists()) {
        const gameState = snapshot.val();
        console.log("Loaded game state from Firebase:", gameState);

        board = gameState.board;
        solution = gameState.solution;
        difficulty = gameState.difficulty;
        startTime = Date.now() - gameState.elapsedTime;

        updateTimer(); // Resume the timer
        setGame(); // Initialize the game with the saved state
    } else {
        alert("No saved game found. Please start a new game.");
    }
}

// Fetch User Streak from Firebase
async function getStreak(username) {
    const sanitizedUsername = sanitizeUsername(username);
    const snapshot = await firebase.database().ref(`users/${sanitizedUsername}`).get();
    if (snapshot.exists()) {
        const data = snapshot.val();
        return {
            streak: data.streak || 0,
            lastWinDate: data.lastWinDate || "",
        };
    } else {
        return { streak: 0, lastWinDate: "" };
    }
    
}

// Save User Streak to Firebase
async function saveStreak(username, streak, lastWinDate) {
    const sanitizedUsername = sanitizeUsername(username);
    await firebase.database().ref(`users/${sanitizedUsername}`).set({ streak, lastWinDate });
}

// Toggle Note Mode
document.getElementById("toggle-note").addEventListener("click", () => {
    noteMode = !noteMode;
    const button = document.getElementById("toggle-note");
    button.innerText = noteMode ? "Note Mode: ON" : "Note Mode: OFF";
    button.classList.toggle("active", noteMode);
});

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem("sudokuUsername");

    if (!username) {
        // Redirect to the login page if no username is found
        window.location.href = "login.html";
    } else {
        // Display the original username
        document.getElementById("welcome-user").innerText = `Welcome, ${username}`;

        // Fetch streak and other user data
        user.username = sanitizeUsername(username);
        const data = await getStreak(user.username);

        user.streak = data.streak;
        user.lastWinDate = data.lastWinDate;

        // Debug logs
        console.log("Original Username:", username);
        console.log("Sanitized Username:", user.username);
        console.log("User Data from Firebase:", data);

        // Update UI with streak
        document.getElementById("user-streak").innerText = `Current Streak: ${user.streak}`;

        // Enable buttons
        document.getElementById("start-new-game").disabled = false;
        document.getElementById("continue-game").disabled = false;
    }
});

document.getElementById("start-new-game").addEventListener("click", async () => {
    console.log("Start New Game clicked. Username:", username); // Debug log
    try {
        document.getElementById("start-new-game").disabled = true;
        await fetchSudokuData();
        await saveGameStateToFirebase(username);
    } catch (error) {
        console.error("Failed to start a new game:", error);
        alert("Failed to start a new game. Please try again.");
    } finally {
        document.getElementById("start-new-game").disabled = false;
    }
});

document.getElementById("back-to-main").addEventListener("click", () => {
    const username = localStorage.getItem("sudokuUsername") || "Player";
    console.log("Back to Main clicked. Username:", username); // Debug log
    saveGameStateToFirebase(username);
    showMainPage();
});

document.getElementById("continue-game").addEventListener("click", async () => {
    console.log("Continue Game button clicked.");
    await loadLastGameFromFirebase(username);
});







