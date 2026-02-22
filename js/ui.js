let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); 
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
        document.getElementById("question").innerText = "問題がありません。リセットボタンで最初からやり直せます。";
        document.getElementById("buzzBtn").disabled = true;
        return;
    }
    charIndex = 0;
    displayInterval = setInterval(() => {
        if (charIndex >= currentQ.question.length) { stopDisplay(); return; }
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
        if (count <= 0) { clearInterval(countdownInterval); revealAnswer(); }
        else { document.getElementById("countdown").innerText = count + "秒"; }
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

// 読み込み・リセットイベント
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const parsedRows = QuizEngine.parseCSV(event.target.result);
        const data = parsedRows.map(row => ({
            question: row[0] ? row[0].replace(/^"|"$/g, '') : "",
            answer: row[1] ? row[1].replace(/^"|"$/g, '') : ""
        })).filter(q => q.question !== "");
        Storage.saveFileName(file.name);
        Storage.saveAll(data);
        location.reload(); 
    };
    reader.readAsText(file, "UTF-8");
});

document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("進捗をリセットして最初からやり直しますか？")) {
        if (QuizEngine.init()) {
            //alert("リセット完了（全問復活＆シャッフル）");
            enableButtons();
            showNextQuestion();
        } else { alert("問題集が読み込まれていません。"); }
    }
});

document.getElementById("buzzBtn").addEventListener("click", stopDisplay);
document.getElementById("showAnswerBtn").addEventListener("click", revealAnswer);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);
document.getElementById("correctBtn").addEventListener("click", showNextQuestion);
document.getElementById("retry1Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 0); showNextQuestion(); });
document.getElementById("retry10Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 10); showNextQuestion(); });