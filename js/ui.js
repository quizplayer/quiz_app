let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;
let isFirstQuestion = true; // 最初の1問目判定用

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); 
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            isFirstQuestion = true; // 起動時はボタン表示から開始
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

    if (isFirstQuestion) {
        // 最初の1問目：ボタン表示
        document.getElementById("question").innerHTML = '<button id="startBtn" class="judgeBtn correctBtn" style="width: auto; padding: 10px 40px;">問題</button>';
        document.getElementById("startBtn").addEventListener("click", () => {
            document.getElementById("question").innerHTML = ""; 
            document.getElementById("question").style.justifyContent = "flex-start";
            isFirstQuestion = false; // 以降は自動再生
            startTextFlow();
        });
    } else {
        // 2問目以降：即座に文字送り開始
        document.getElementById("question").style.justifyContent = "flex-start";
        startTextFlow();
    }
}

function startTextFlow() {
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
    document.getElementById("question").style.justifyContent = "flex-start";
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
    // ボタン表示に備えて中央揃え（自動再生時は直後に左揃えに上書きされる）
    document.getElementById("question").style.justifyContent = "center"; 
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
            isFirstQuestion = true; // リセット後はボタン表示に戻す
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