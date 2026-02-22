let questions = [];
let currentIndex = 0;
let currentAnswer = "";
let currentQuestionFull = "";
let displayInterval = null;
let charIndex = 0;
let countdownInterval = null;
let countdownValue = 5;
let isCounting = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

document.getElementById("loadBtn").addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        parseCSV(e.target.result);
        shuffleArray(questions);
        if (questions.length > 0) {
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("buzzBtn").disabled = false;
            showQuestion();
        }
    };
    reader.readAsText(file, "UTF-8");
});

function parseCSV(text) {
    const lines = text.trim().split("\n");
    questions = lines.map(line => {
        const parts = line.split(",");
        const q = parts[0];
        const a = parts.slice(1).join(",");
        return { question: q, answer: a };
    });
    currentIndex = 0;
}

function showQuestion() {
    clearInterval(displayInterval);
    clearInterval(countdownInterval);
    isCounting = false;

    document.getElementById("answerText").innerText = "";
    document.getElementById("countdown").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
    document.getElementById("buzzBtn").disabled = false;
    document.getElementById("showAnswerBtn").style.display = "inline-block";

    if (currentIndex >= questions.length) {
        document.getElementById("question").innerText = "問題はもうありません。";
        document.getElementById("buzzBtn").disabled = true;
        return;
    }

    const q = questions[currentIndex];
    currentAnswer = q.answer;
    currentQuestionFull = q.question;
    currentIndex++;

    document.getElementById("question").innerText = "問題";

    setTimeout(() => {
        document.getElementById("question").innerText = "";
        charIndex = 0;

        displayInterval = setInterval(() => {
            if (charIndex >= currentQuestionFull.length) {
                clearInterval(displayInterval);
                document.getElementById("answerSection").style.display = "block";
                
                // 読み上げ終了後は早押し不可
                document.getElementById("buzzBtn").disabled = true;

                startCountdown();
                return;
            }
            document.getElementById("question").innerText += currentQuestionFull[charIndex];
            charIndex++;
        }, 100);
    }, 1000);
}

function buzz() {
    document.getElementById("buzzBtn").disabled = true;
    clearInterval(displayInterval);
    document.getElementById("answerSection").style.display = "block";
    startCountdown();
}

function startCountdown() {
    countdownValue = 5;
    isCounting = true;
    document.getElementById("countdown").innerText = countdownValue + "秒";

    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            isCounting = false;
            showAnswer();
        } else {
            document.getElementById("countdown").innerText = countdownValue + "秒";
        }
    }, 1000);
}

function showAnswer() {
    if (isCounting) {
        clearInterval(countdownInterval);
        isCounting = false;
    }
    document.getElementById("countdown").innerText = "";
    document.getElementById("question").innerText = currentQuestionFull;
    document.getElementById("answerText").innerText = "答え: " + currentAnswer;
    document.getElementById("judgeButtons").style.display = "block";
    document.getElementById("showAnswerBtn").style.display = "none";
}

// 正解・不正解ボタンの挙動修正
document.getElementById("correctBtn").addEventListener("click", showQuestion);

document.getElementById("incorrectBtn").addEventListener("click", () => {
    const currentQ = { question: currentQuestionFull, answer: currentAnswer };
    let targetIndex = currentIndex + 10;
    if (targetIndex > questions.length) targetIndex = questions.length;
    
    questions.splice(targetIndex, 0, currentQ);
    showQuestion();
});

document.getElementById("nextBtn").addEventListener("click", showQuestion);
document.getElementById("buzzBtn").addEventListener("click", buzz);
document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);