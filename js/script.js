let questions = [];
let currentAnswer = "";
let currentQuestionFull = "";
let displayInterval = null;
let charIndex = 0;
let countdownInterval = null;
let countdownValue = 5;
let isCounting = false;

// ページ読み込み時にlocalStorageから復元
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
            showQuestion();
        }
    }
};

// データの保存
function saveToStorage() {
    localStorage.setItem("quiz_questions", JSON.stringify(questions));
}

// シャッフル関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// CSV読み込みボタン
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    localStorage.setItem("quiz_filename", file.name);
    document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.trim().split("\n");
        let newQuestions = lines.map(line => {
            const parts = line.split(",");
            return { 
                question: parts[0], 
                answer: parts.slice(1).join(",") 
            };
        });

        // 読み込み時にシャッフルして順番を固定する
        shuffleArray(newQuestions);
        questions = newQuestions;
        
        saveToStorage();

        if (questions.length > 0) {
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("buzzBtn").disabled = false;
            showQuestion();
        }
    };
    reader.readAsText(file, "UTF-8");
});

// 問題表示メインロジック
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
        document.getElementById("question").innerText = "問題がありません。";
        document.getElementById("buzzBtn").disabled = true;
        return;
    }

    // ★重要：常に配列の先頭(0番目)を取り出す
    const qData = questions[0];
    currentAnswer = qData.answer;
    currentQuestionFull = qData.question;

    // 出題する問題を配列から削除
    questions.shift();
    saveToStorage();

    document.getElementById("question").innerText = "";
    charIndex = 0;

    displayInterval = setInterval(() => {
        if (charIndex >= currentQuestionFull.length) {
            clearInterval(displayInterval);
            document.getElementById("answerSection").style.display = "block";
            document.getElementById("buzzBtn").disabled = true; // 読み上げ終了後は早押し不可
            startCountdown();
            return;
        }
        document.getElementById("question").innerText += currentQuestionFull[charIndex];
        charIndex++;
    }, 100);
}

// 早押し
function buzz() {
    document.getElementById("buzzBtn").disabled = true;
    clearInterval(displayInterval);
    document.getElementById("answerSection").style.display = "block";
    startCountdown();
}

// カウントダウン
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

// 解答表示
function showAnswer() {
    if (isCounting) { clearInterval(countdownInterval); isCounting = false; }
    document.getElementById("countdown").innerText = "";
    document.getElementById("question").innerText = currentQuestionFull;
    document.getElementById("answerText").innerText = "答え: " + currentAnswer;
    document.getElementById("judgeButtons").style.display = "flex";
    document.getElementById("showAnswerBtn").style.display = "none";
}

// --- 判定ボタンの処理 ---

// 正解（完了）：配列からは削除済みなので、そのまま次へ
document.getElementById("correctBtn").addEventListener("click", showQuestion);

// 1問後に表示：配列の先頭（0番目）に戻す
document.getElementById("retry1Btn").addEventListener("click", () => {
    const retryQ = { question: currentQuestionFull, answer: currentAnswer };
    questions.unshift(retryQ); 
    saveToStorage();
    showQuestion();
});

// 10問後に表示：配列の10番目（または最後）に挿入
document.getElementById("retry10Btn").addEventListener("click", () => {
    const retryQ = { question: currentQuestionFull, answer: currentAnswer };
    let insertPos = 10;
    if (insertPos > questions.length) insertPos = questions.length;
    questions.splice(insertPos, 0, retryQ);
    saveToStorage();
    showQuestion();
});

// 下部パネルボタン
document.getElementById("nextBtn").addEventListener("click", showQuestion);
document.getElementById("buzzBtn").addEventListener("click", buzz);
document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);