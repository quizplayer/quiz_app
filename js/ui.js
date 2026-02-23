let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;
let isFirstQuestion = true;
let isVoiceMode = false; 
let isAutoMode = false; 
let currentUtterance = null;

// --- 調整用パラメータ ---
const SPEECH_RATE = 1.0;      // 読み上げ速度 (1.0が標準)
const INTERVAL_TIME = 500;    // 自動再生時の間隔 (ms) 1000→500へ短縮
// -----------------------

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); 
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            isFirstQuestion = true;
            const savedMode = Storage.getMode();
            applyMode(savedMode); 
            showNextQuestion();
        }
    }
};

document.getElementById("modeTextBtn").addEventListener("click", () => switchMode('text'));
document.getElementById("modeVoiceBtn").addEventListener("click", () => switchMode('voice'));
document.getElementById("modeAutoBtn").addEventListener("click", () => switchMode('auto'));

function switchMode(mode) {
    Storage.saveMode(mode);
    applyMode(mode);
    isFirstQuestion = true; 
    showNextQuestion();
}

function applyMode(mode) {
    isVoiceMode = (mode === 'voice');
    isAutoMode = (mode === 'auto');
    document.getElementById("modeTextBtn").style.backgroundColor = (mode === 'text') ? "#4CAF50" : "#777";
    document.getElementById("modeVoiceBtn").style.backgroundColor = (mode === 'voice') ? "#4CAF50" : "#777";
    document.getElementById("modeAutoBtn").style.backgroundColor = (mode === 'auto') ? "#4CAF50" : "#777";
    speechSynthesis.cancel();
}

function enableButtons() {
    document.getElementById("nextBtn").disabled = false;
    document.getElementById("buzzBtn").disabled = true;
}

function showNextQuestion() {
    resetUI();
    currentQ = QuizEngine.getNext();
    if (!currentQ) {
        document.getElementById("question").innerText = "問題がありません。";
        document.getElementById("buzzBtn").disabled = true;
        return;
    }

    document.getElementById("question").style.display = "flex";
    document.getElementById("question").style.justifyContent = "flex-start";

    if (isFirstQuestion) {
        document.getElementById("buzzBtn").disabled = true;
        const btnText = isAutoMode ? "自動再生を開始" : "問題";
        document.getElementById("question").innerHTML = `<button id="startBtn" class="judgeBtn correctBtn" style="width: auto; padding: 10px 40px;">${btnText}</button>`;
        document.getElementById("startBtn").addEventListener("click", () => {
            document.getElementById("question").innerHTML = ""; 
            isFirstQuestion = false;
            if (!isAutoMode) document.getElementById("buzzBtn").disabled = false;
            startTextFlow();
        });
    } else {
        if (!isAutoMode) document.getElementById("buzzBtn").disabled = false;
        startTextFlow();
    }
}

function startTextFlow() {
    charIndex = 0;
    if (isAutoMode) {
        startAutoFlow();
    } else if (isVoiceMode) {
        startVoiceFlow();
    } else {
        startVisualFlow();
    }
}

function startVisualFlow() {
    displayInterval = setInterval(() => {
        if (charIndex >= currentQ.question.length) {
            stopDisplay();
            return;
        }
        document.getElementById("question").innerText += currentQ.question[charIndex];
        charIndex++;
    }, 100);
}

function startVoiceFlow() {
    const cleanedText = currentQ.question.replace(/[(\（].*?[)\）]/g, "");
    const speakText = "問題。" + cleanedText;
    currentUtterance = new SpeechSynthesisUtterance(speakText);
    currentUtterance.lang = 'ja-JP';
    currentUtterance.rate = SPEECH_RATE; // 速度適用

    currentUtterance.onend = () => {
        if (document.getElementById("answerSection").style.display === "none") {
            stopDisplay();
        }
    };
    speechSynthesis.speak(currentUtterance);
}

function startAutoFlow() {
    document.getElementById("buzzBtn").disabled = true;
    const cleanedText = currentQ.question.replace(/[(\（].*?[)\）]/g, "");
    const utterQ = new SpeechSynthesisUtterance("問題。" + cleanedText);
    utterQ.lang = 'ja-JP';
    utterQ.rate = SPEECH_RATE; // 速度適用

    utterQ.onend = () => {
        document.getElementById("question").innerText = currentQ.question;
        // 問題と答えの間隔を短縮
        setTimeout(() => {
            if (!isAutoMode) return;
            const utterA = new SpeechSynthesisUtterance("答え。" + currentQ.answer);
            utterA.lang = 'ja-JP';
            utterA.rate = SPEECH_RATE; // 速度適用
            utterA.onstart = () => {
                document.getElementById("answerText").innerText = "答え: " + currentQ.answer;
                document.getElementById("answerSection").style.display = "block";
            };
            utterA.onend = () => {
                // 答えと次の問題の間隔を短縮
                setTimeout(() => {
                    if (isAutoMode) showNextQuestion();
                }, INTERVAL_TIME);
            };
            speechSynthesis.speak(utterA);
        }, INTERVAL_TIME);
    };
    speechSynthesis.speak(utterQ);
}

function stopDisplay() {
    clearInterval(displayInterval);
    speechSynthesis.cancel(); 
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
    speechSynthesis.cancel();
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
    speechSynthesis.cancel();
    document.getElementById("question").style.justifyContent = "flex-start";
    document.getElementById("question").innerText = "";
    document.getElementById("answerText").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = "inline-block";
    document.getElementById("buzzBtn").disabled = true;
}

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
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + file.name;
        QuizEngine.init(); 
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            isFirstQuestion = true;
            showNextQuestion();
        }
    };
    reader.readAsText(file, "UTF-8");
});

document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("進捗をリセットして最初からやり直しますか？")) {
        if (QuizEngine.init()) {
            isFirstQuestion = true;
            enableButtons();
            showNextQuestion();
        }
    }
});

document.getElementById("buzzBtn").addEventListener("click", stopDisplay);
document.getElementById("showAnswerBtn").addEventListener("click", revealAnswer);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);
document.getElementById("correctBtn").addEventListener("click", showNextQuestion);
document.getElementById("retry1Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 0); showNextQuestion(); });
document.getElementById("retry10Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 10); showNextQuestion(); });