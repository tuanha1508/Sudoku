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

firebase.initializeApp(firebaseConfig);

document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username) {
        localStorage.setItem("sudokuUsername", username); 
        window.location.href = "index.html"; 
    } else {
        alert("Please enter a valid username.");
    }
});
