let questions = [];
let currentIndex = 0;
let currentAnswer = "";
let currentQuestionFull = "";
let displayInterval = null;
let charIndex = 0;
let countdownInterval = null;
let countdownValue = 5;
let isCounting = false;

// シャッフル
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// CSV読み込み
document.getElementById("loadBtn").addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        parseCSV(e.target.result);
        shuffleArray(questions);
        if (questions.length > 0) {
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("buzzBtn").disabled = false;
        }
    };
    reader.readAsText(file, "UTF-8");
});

function parseCSV(text) {
    const lines = text.trim().split("\n");
    questions = lines.map(line => {
        const parts = line.split(",");
        return { question: parts[0], answer: parts[1] };
    });
    currentIndex = 0;
}

// 問題表示処理
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
        return;
    }

    const q = questions[currentIndex];
    currentAnswer = q.answer;
    currentQuestionFull = q.question;
    currentIndex++;

    // ① まず「問題」と表示
    document.getElementById("question").innerText = "問題";

    // ② 1秒後に文字送り開始
    setTimeout(() => {
        document.getElementById("question").innerText = "";
        charIndex = 0;

        displayInterval = setInterval(() => {
            if (charIndex >= currentQuestionFull.length) {
                clearInterval(displayInterval);
                return;
            }
            document.getElementById("question").innerText += currentQuestionFull[charIndex];
            charIndex++;
        }, 100);

    }, 1000);
}

// 早押し
function buzz() {
    document.getElementById("buzzBtn").disabled = true;
    clearInterval(displayInterval);

    document.getElementById("answerSection").style.display = "block";

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

    // 追加 ↓
    document.getElementById("showAnswerBtn").style.display = "none";
}

// ボタン
document.getElementById("nextBtn").addEventListener("click", showQuestion);
document.getElementById("buzzBtn").addEventListener("click", buzz);
document.getElementById("correctBtn").addEventListener("click", showQuestion);
document.getElementById("incorrectBtn").addEventListener("click", showQuestion);
document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);