let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;
let isFirstQuestion = true;
let isVoiceMode = false; 
let isAutoMode = false; 
let isPaused = false; 

const silentAudio = new Audio("https://github.com/anars/blank-audio/raw/master/10-seconds-of-silence.mp3");
silentAudio.loop = true;

window.onload = () => {
    const fileName = Storage.getFileName();
    if (fileName) {
        document.getElementById("fileNameDisplay").innerText = "現在の問題集: " + fileName;
        QuizEngine.init(); 
        if (QuizEngine.questions.length > 0) {
            enableButtons();
            isFirstQuestion = true;
            applyMode(Storage.getMode()); 
            showNextQuestion();
        }
    }

    // メニュー開閉
    const sideMenu = document.getElementById("sideMenu");
    const menuOverlay = document.getElementById("menuOverlay");
    document.getElementById("menuOpenBtn").addEventListener("click", () => {
        sideMenu.classList.add("open");
        menuOverlay.classList.add("show");
    });
    const closeMenu = () => {
        sideMenu.classList.remove("open");
        menuOverlay.classList.remove("show");
    };
    document.getElementById("menuCloseBtn").addEventListener("click", closeMenu);
    menuOverlay.addEventListener("click", closeMenu);

    // 開始位置入力
    const startInput = document.getElementById("startIndexInput");
    startInput.value = Storage.getStartIndex();
    startInput.addEventListener("change", (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        Storage.saveStartIndex(val);
        if (QuizEngine.init()) {
            isFirstQuestion = true;
            showNextQuestion();
        }
    });

    updateShuffleBtnUI();
    initSearch();
};

function updateShuffleBtnUI() {
    const isShuffle = Storage.getShuffleSetting();
    const btn = document.getElementById("shuffleToggleBtn");
    const startInput = document.getElementById("startIndexInput");
    btn.innerText = isShuffle ? "シャッフル: ON" : "シャッフル: OFF";
    btn.style.backgroundColor = isShuffle ? "#9C27B0" : "#607D8B";
    startInput.disabled = isShuffle;
    document.getElementById("startIndexContainer").style.opacity = isShuffle ? "0.5" : "1";
}

function applyMode(mode) {
    isVoiceMode = (mode === 'voice');
    isAutoMode = (mode === 'auto');
    isPaused = false;
    
    document.getElementById("modeTextBtn").style.backgroundColor = (mode === 'text') ? "#4CAF50" : "#777";
    document.getElementById("modeVoiceBtn").style.backgroundColor = (mode === 'voice') ? "#4CAF50" : "#777";
    document.getElementById("modeAutoBtn").style.backgroundColor = (mode === 'auto') ? "#4CAF50" : "#777";
    
    updatePauseBtnUI(true);
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("buzzBtn").style.display = isAutoMode ? "none" : "inline-block";
    document.getElementById("showAnswerBtn").style.display = isAutoMode ? "none" : "inline-block";
    
    AutoFlowManager.stop();
}

function updatePauseBtnUI(enabled, label = "一時停止", color = "#f0ad4e") {
    const btn = document.getElementById("pauseBtn");
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.5";
    btn.innerText = label;
    btn.style.backgroundColor = color;
}

function togglePause() {
    if (!isAutoMode) return;
    if (!isPaused) {
        isPaused = true;
        AudioPlayer.pause();
        if (AutoFlowManager.timer) clearTimeout(AutoFlowManager.timer);
        updatePauseBtnUI(true, "再開", "#5cb85c");
    } else {
        isPaused = false;
        updatePauseBtnUI(true, "一時停止", "#f0ad4e");
        if (AudioPlayer.isPaused()) AudioPlayer.resume();
        else startCurrentFlow();
    }
}

function showNextQuestion() {
    resetUI();
    isPaused = false;
    const currentNum = QuizEngine.getCurrentNumber() + 1;
    document.getElementById("progressDisplay").innerText = `第 ${currentNum} 問 / 全 ${QuizEngine.totalCount} 問`;

    updatePauseBtnUI(true);
    document.getElementById("pauseBtn").style.display = "none";

    currentQ = QuizEngine.getNext();
    if (!currentQ) {
        document.getElementById("question").innerText = "すべての問題を解きました！";
        return;
    }

    if (isFirstQuestion) {
        const btnText = isAutoMode ? "自動再生を開始" : "開始";
        document.getElementById("question").innerHTML = `<button id="startBtn" class="judgeBtn correctBtn" style="width: auto; padding: 10px 40px;">${btnText}</button>`;
        document.getElementById("startBtn").addEventListener("click", () => {
            isFirstQuestion = false;
            if (isAutoMode) document.getElementById("pauseBtn").style.display = "inline-block";
            else document.getElementById("buzzBtn").disabled = false;
            if (isAutoMode || isVoiceMode) silentAudio.play().catch(() => {});
            startCurrentFlow();
        });
    } else {
        if (isAutoMode) document.getElementById("pauseBtn").style.display = "inline-block";
        else document.getElementById("buzzBtn").disabled = false;
        startCurrentFlow();
    }
}

function startCurrentFlow() {
    charIndex = 0;
    document.getElementById("question").innerText = "";
    if (isAutoMode) {
        AutoFlowManager.start(currentQ, 
            () => { // 答え表示開始
                updatePauseBtnUI(true);
                document.getElementById("question").innerText = currentQ.question;
                document.getElementById("answerText").innerText = "答え: " + currentQ.answer;
                document.getElementById("answerSection").style.display = "block";
            },
            () => { // 問題終了(待機中)
                updatePauseBtnUI(false, "待機中...");
            },
            () => { // サイクル完了
                if (isAutoMode && !isPaused) showNextQuestion();
            }
        );
    } else if (isVoiceMode) {
        AudioPlayer.play("問題。" + AudioPlayer.cleanText(currentQ.question), null, () => {
            if (document.getElementById("answerSection").style.display === "none") stopDisplay();
        });
    } else {
        displayInterval = setInterval(() => {
            if (charIndex >= currentQ.question.length) { stopDisplay(); return; }
            document.getElementById("question").innerText += currentQ.question[charIndex];
            charIndex++;
        }, 100);
    }
}

function stopDisplay() {
    clearInterval(displayInterval);
    AudioPlayer.stop();
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
        else document.getElementById("countdown").innerText = count + "秒";
    }, 1000);
}

function revealAnswer() {
    clearInterval(displayInterval);
    clearInterval(countdownInterval);
    AudioPlayer.stop();
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
    AutoFlowManager.stop();
    document.getElementById("question").innerText = "";
    document.getElementById("answerText").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = isAutoMode ? "none" : "inline-block";
}

function enableButtons() {
    document.getElementById("nextBtn").disabled = false;
}

function initSearch() {
    const overlay = document.getElementById("searchOverlay");
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    document.getElementById("openSearchBtn").addEventListener("click", () => {
        overlay.style.display = "block";
        input.focus();
    });
    document.getElementById("closeSearchBtn").addEventListener("click", () => overlay.style.display = "none");
    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const all = Storage.loadAll();
        if (!query) { results.innerHTML = ""; return; }
        const filtered = all.filter(q => q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query));
        results.innerHTML = filtered.map(q => `<div style="border-bottom:1px solid #eee; padding:10px 0;"><div>${q.question}</div><div style="font-weight:bold; color:#4CAF50;">答: ${q.answer}</div></div>`).join("");
    });
}

document.getElementById("modeTextBtn").addEventListener("click", () => { Storage.saveMode('text'); applyMode('text'); isFirstQuestion = true; showNextQuestion(); });
document.getElementById("modeVoiceBtn").addEventListener("click", () => { Storage.saveMode('voice'); applyMode('voice'); isFirstQuestion = true; showNextQuestion(); });
document.getElementById("modeAutoBtn").addEventListener("click", () => { Storage.saveMode('auto'); applyMode('auto'); isFirstQuestion = true; showNextQuestion(); });
document.getElementById("shuffleToggleBtn").addEventListener("click", () => {
    const current = Storage.getShuffleSetting();
    Storage.saveShuffleSetting(!current);
    updateShuffleBtnUI();
    if (confirm("設定を変更しました。最初からやり直しますか？")) {
        if (QuizEngine.init()) { isFirstQuestion = true; showNextQuestion(); }
    }
});
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
document.getElementById("buzzBtn").addEventListener("click", stopDisplay);
document.getElementById("showAnswerBtn").addEventListener("click", revealAnswer);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);
document.getElementById("correctBtn").addEventListener("click", showNextQuestion);
document.getElementById("retry1Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 0); showNextQuestion(); });
document.getElementById("retry10Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 10); showNextQuestion(); });

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

document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("最初からやり直しますか？")) {
        if (QuizEngine.init()) { isFirstQuestion = true; showNextQuestion(); }
    }
});