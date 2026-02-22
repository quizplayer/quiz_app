let questions = [];
let currentAnswer = "";
let currentQuestionFull = "";
let displayInterval = null;
let charIndex = 0;
let countdownInterval = null;
let countdownValue = 5;
let isCounting = false;

// ページ読み込み時の処理
window.onload = () => {
    const savedData = localStorage.getItem("quiz_questions");
    const savedFileName = localStorage.getItem("quiz_filename");
    
    if (savedData) {
        questions = JSON.parse(savedData);
        if (savedFileName) {
            document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + savedFileName;
        }
        if (questions.length > 0) {
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("buzzBtn").disabled = false;
            // ページを戻ったときは、自動で次のランダム問題を表示
            showQuestion();
        }
    }
};

// CSV読み込み
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    localStorage.setItem("quiz_filename", file.name);
    document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.trim().split("\n");
        questions = lines.map(line => {
            const parts = line.split(",");
            return { question: parts[0], answer: parts.slice(1).join(",") };
        });
        
        // 読み込み直後に保存
        saveToStorage();

        if (questions.length > 0) {
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("buzzBtn").disabled = false;
            showQuestion();
        }
    };
    reader.readAsText(file, "UTF-8");
});

function saveToStorage() {
    localStorage.setItem("quiz_questions", JSON.stringify(questions));
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

    if (questions.length === 0) {
        document.getElementById("question").innerText = "問題がありません。CSVを読み込んでください。";
        document.getElementById("buzzBtn").disabled = true;
        return;
    }

    // ★ 完全ランダム：配列からランダムなインデックスを選択
    const randomIndex = Math.floor(Math.random() * questions.length);
    const qData = questions[randomIndex];

    currentAnswer = qData.answer;
    currentQuestionFull = qData.question;

    // ★ 出題した問題を配列から一旦削除（正解なら消えたまま、不正解なら後で戻す）
    questions.splice(randomIndex, 1);
    saveToStorage();

    document.getElementById("question").innerText = "";
    charIndex = 0;

    displayInterval = setInterval(() => {
        if (charIndex >= currentQuestionFull.length) {
            clearInterval(displayInterval);
            document.getElementById("answerSection").style.display = "block";
            document.getElementById("buzzBtn").disabled = true;
            startCountdown();
            return;
        }
        document.getElementById("question").innerText += currentQuestionFull[charIndex];
        charIndex++;
    }, 100);
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
    if (isCounting) { clearInterval(countdownInterval); isCounting = false; }
    document.getElementById("countdown").innerText = "";
    document.getElementById("question").innerText = currentQuestionFull;
    document.getElementById("answerText").innerText = "答え: " + currentAnswer;
    document.getElementById("judgeButtons").style.display = "block";
    document.getElementById("showAnswerBtn").style.display = "none";
}

// 正解：そのまま次へ（配列からは既に消えている）
document.getElementById("correctBtn").addEventListener("click", showQuestion);

// 不正解：10問後（または最後）に挿入して次へ
document.getElementById("incorrectBtn").addEventListener("click", () => {
    const retryQ = { question: currentQuestionFull, answer: currentAnswer };
    let insertPos = 10;
    if (insertPos > questions.length) insertPos = questions.length;
    
    questions.splice(insertPos, 0, retryQ);
    saveToStorage();
    showQuestion();
});

document.getElementById("nextBtn").addEventListener("click", showQuestion);
document.getElementById("buzzBtn").addEventListener("click", buzz);
document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);