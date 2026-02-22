let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); // 起動時にリセット
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            showNextQuestion();
        }
    }
};

function enableButtons() {
    document.getElementById("nextBtn").disabled = false;
    document.getElementById("buzzBtn").disabled = false;
}

function showNextQuestion() {
    resetUI();
    currentQ = QuizEngine.getNext();
    if (!currentQ) {
        document.getElementById("question").innerText = "問題がありません。";
        return;
    }
    
    charIndex = 0;
    displayInterval = setInterval(() => {
        if (charIndex >= currentQ.question.length) {
            stopDisplay();
            return;
        }
        document.getElementById("question").innerText += currentQ.question[charIndex];
        charIndex++;
    }, 100);
}

function stopDisplay() {
    clearInterval(displayInterval);
    document.getElementById("answerSection").style.display = "block";
    document.getElementById("buzzBtn").disabled = true;
    startCountdown();
}

function startCountdown() {
    let count = 5;
    document.getElementById("countdown").innerText = count + "秒";
    countdownInterval = setInterval(() => {
        count--;
        if (count <= 0) {
            clearInterval(countdownInterval);
            revealAnswer();
        } else {
            document.getElementById("countdown").innerText = count + "秒";
        }
    }, 1000);
}

function revealAnswer() {
    clearInterval(displayInterval);
    clearInterval(countdownInterval);
    document.getElementById("question").innerText = currentQ.question;
    document.getElementById("answerText").innerText = "答え: " + currentQ.answer;
    document.getElementById("answerSection").style.display = "block";
    document.getElementById("judgeButtons").style.display = "flex";
    document.getElementById("showAnswerBtn").style.display = "none";
    document.getElementById("countdown").innerText = "";
}

function resetUI() {
    clearInterval(displayInterval);
    clearInterval(countdownInterval);
    document.getElementById("question").innerText = "";
    document.getElementById("answerText").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = "inline-block";
    document.getElementById("buzzBtn").disabled = false;
}

// イベント登録
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const lines = event.target.result.trim().split(/\r\n|\n/).filter(l => l.trim() !== "");
        const data = lines.map(l => ({ question: l.split(",")[0], answer: l.split(",").slice(1).join(",") }));
        Storage.saveFileName(file.name);
        Storage.saveAll(data);
        location.reload(); // 再読み込みして初期化
    };
    reader.readAsText(file, "UTF-8");
});

document.getElementById("buzzBtn").addEventListener("click", stopDisplay);
document.getElementById("showAnswerBtn").addEventListener("click", revealAnswer);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);
document.getElementById("correctBtn").addEventListener("click", showNextQuestion);
document.getElementById("retry1Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 0); showNextQuestion(); });
document.getElementById("retry10Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 10); showNextQuestion(); });