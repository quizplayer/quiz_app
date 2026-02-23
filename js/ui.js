let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;
let isFirstQuestion = true;
let isVoiceMode = false; 
let currentUtterance = null;

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); 
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            isFirstQuestion = true;
            showNextQuestion();
        }
    }
};

// モード切替イベント
document.getElementById("modeTextBtn").addEventListener("click", () => switchMode(false));
document.getElementById("modeVoiceBtn").addEventListener("click", () => switchMode(true));

function switchMode(voice) {
    isVoiceMode = voice;
    document.getElementById("modeVoiceBtn").style.backgroundColor = voice ? "#4CAF50" : "#777";
    document.getElementById("modeTextBtn").style.backgroundColor = voice ? "#777" : "#4CAF50";
    speechSynthesis.cancel(); 
    isFirstQuestion = true; 
    showNextQuestion();
}

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
        document.getElementById("question").innerHTML = '<button id="startBtn" class="judgeBtn correctBtn" style="width: auto; padding: 10px 40px;">問題</button>';
        document.getElementById("startBtn").addEventListener("click", () => {
            document.getElementById("question").innerHTML = ""; 
            isFirstQuestion = false;
            startTextFlow();
        });
    } else {
        startTextFlow();
    }
}

function startTextFlow() {
    charIndex = 0;
    if (isVoiceMode) {
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

// 【改善版】音声読み上げ：カッコ除去を強化
function startVoiceFlow() {
    // 修正ポイント：半角・全角が混在したカッコ [ (（ ] ～ [ )） ] をすべて中身ごと消去
    const cleanedText = currentQ.question.replace(/[(\（].*?[)\）]/g, "");
    
    // 「問題。」を頭に付ける
    const speakText = "問題。" + cleanedText;
    
    currentUtterance = new SpeechSynthesisUtterance(speakText);
    currentUtterance.lang = 'ja-JP';
    currentUtterance.rate = 1.0;

    currentUtterance.onend = () => {
        if (document.getElementById("answerSection").style.display === "none") {
            stopDisplay();
        }
    };
    speechSynthesis.speak(currentUtterance);
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
    document.getElementById("question").innerText = "";
    document.getElementById("answerText").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = "inline-block";
    document.getElementById("buzzBtn").disabled = false;
}

// 【修正】リロードなしでCSV読み込み
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