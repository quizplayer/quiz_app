let currentQ = null;
let displayInterval = null;
let countdownInterval = null;
let charIndex = 0;
let isFirstQuestion = true;
let isVoiceMode = false; 
let isAutoMode = false; 
let isPaused = false; 
let currentUtterance = null;
let autoTimer = null; 

// 読み上げ速度と自動再生時の間隔
const SPEECH_RATE = 1.0;      
const INTERVAL_TIME = 1000;   

// バックグラウンド再生維持用の無音オーディオ
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
            const savedMode = Storage.getMode();
            applyMode(savedMode); 
            showNextQuestion();
        }
    }
    initSearch();
};

/**
 * モード切替とUIの初期化
 */
function applyMode(mode) {
    isVoiceMode = (mode === 'voice');
    isAutoMode = (mode === 'auto');
    isPaused = false;
    
    document.getElementById("modeTextBtn").style.backgroundColor = (mode === 'text') ? "#4CAF50" : "#777";
    document.getElementById("modeVoiceBtn").style.backgroundColor = (mode === 'voice') ? "#4CAF50" : "#777";
    document.getElementById("modeAutoBtn").style.backgroundColor = (mode === 'auto') ? "#4CAF50" : "#777";
    
    // 一時停止・早押しボタンをリセット
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("buzzBtn").style.display = isAutoMode ? "none" : "inline-block";
    
    // 自動再生モードなら「解答を表示」ボタンを非表示
    document.getElementById("showAnswerBtn").style.display = isAutoMode ? "none" : "inline-block";

    speechSynthesis.cancel();
    silentAudio.pause();
    if (autoTimer) clearTimeout(autoTimer);
}

function switchMode(mode) {
    Storage.saveMode(mode); 
    applyMode(mode);        
    isFirstQuestion = true; 
    showNextQuestion();
}

/**
 * 一時停止 / 再開
 */
function togglePause() {
    if (!isAutoMode) return;
    
    if (!isPaused) {
        isPaused = true;
        speechSynthesis.pause(); 
        silentAudio.pause();
        if (autoTimer) clearTimeout(autoTimer);

        document.getElementById("pauseBtn").innerText = "再開";
        document.getElementById("pauseBtn").style.backgroundColor = "#5cb85c";
    } else {
        isPaused = false;
        document.getElementById("pauseBtn").innerText = "一時停止";
        document.getElementById("pauseBtn").style.backgroundColor = "#f0ad4e";
        
        silentAudio.play().catch(() => {});
        
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        } else {
            startAutoFlow();
        }
    }
}

/**
 * 問題の表示とボタン制御
 */
function showNextQuestion() {
    resetUI();
    isPaused = false;

    // ボタンの初期状態をリセット
    const pauseBtn = document.getElementById("pauseBtn");
    pauseBtn.innerText = "一時停止";
    pauseBtn.style.backgroundColor = "#f0ad4e";
    pauseBtn.disabled = false;
    pauseBtn.style.display = "none";

    document.getElementById("buzzBtn").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = isAutoMode ? "none" : "inline-block";

    currentQ = QuizEngine.getNext();
    if (!currentQ) {
        document.getElementById("question").innerText = "問題がありません。";
        return;
    }

    if (isFirstQuestion) {
        const btnText = isAutoMode ? "自動再生を開始" : "問題";
        document.getElementById("question").innerHTML = `<button id="startBtn" class="judgeBtn correctBtn" style="width: auto; padding: 10px 40px;">${btnText}</button>`;
        document.getElementById("startBtn").addEventListener("click", () => {
            document.getElementById("question").innerHTML = ""; 
            isFirstQuestion = false;
            
            if (isAutoMode) {
                document.getElementById("pauseBtn").style.display = "inline-block";
            } else {
                document.getElementById("buzzBtn").style.display = "inline-block";
                document.getElementById("buzzBtn").disabled = false;
            }

            if (isAutoMode || isVoiceMode) silentAudio.play().catch(() => {});
            startTextFlow();
        });
    } else {
        if (isAutoMode) {
            document.getElementById("pauseBtn").style.display = "inline-block";
        } else {
            document.getElementById("buzzBtn").style.display = "inline-block";
            document.getElementById("buzzBtn").disabled = false;
        }
        startTextFlow();
    }
}

/**
 * 自動再生フロー
 * 問題読み上げ終了から答え開始までの間、一時停止を無効化する
 */
function startAutoFlow() {
    if (isPaused) return;
    
    const pauseBtn = document.getElementById("pauseBtn");
    pauseBtn.disabled = false; // 問題読み上げ中は押せる

    silentAudio.play().catch(() => {});
    updateMediaSession("問題読み上げ中", currentQ.question.substring(0, 30));
    
    const cleaned = currentQ.question.replace(/[(\（].*?[)\）]/g, "");
    const utterQ = new SpeechSynthesisUtterance("問題。" + cleaned);
    utterQ.lang = 'ja-JP';
    utterQ.rate = SPEECH_RATE;

    utterQ.onend = () => {
        if (isPaused) return; 
        
        // 【修正】問題文読み上げ終了時に一時停止を無効化
        pauseBtn.disabled = true;
        pauseBtn.style.opacity = "0.5";

        autoTimer = setTimeout(() => {
            if (!isAutoMode || isPaused) return;
            
            updateMediaSession("答え読み上げ中", currentQ.answer);
            const utterA = new SpeechSynthesisUtterance("答え。" + currentQ.answer);
            utterA.lang = 'ja-JP';
            utterA.rate = SPEECH_RATE;
            
            utterA.onstart = () => {
                // 【修正】答えの読み上げが始まったら一時停止を再度有効化
                pauseBtn.disabled = false;
                pauseBtn.style.opacity = "1";

                document.getElementById("question").innerText = currentQ.question;
                document.getElementById("answerText").innerText = "答え: " + currentQ.answer;
                document.getElementById("answerSection").style.display = "block";
            };
            
            utterA.onend = () => {
                autoTimer = setTimeout(() => { 
                    if (isAutoMode && !isPaused) showNextQuestion(); 
                }, INTERVAL_TIME);
            };
            speechSynthesis.speak(utterA);
        }, INTERVAL_TIME);
    };
    speechSynthesis.speak(utterQ);
}

// --- 通常再生・視覚フロー ---
function startTextFlow() {
    charIndex = 0;
    if (isAutoMode) startAutoFlow();
    else if (isVoiceMode) startVoiceFlow();
    else startVisualFlow();
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
    const cleaned = currentQ.question.replace(/[(\（].*?[)\）]/g, "");
    currentUtterance = new SpeechSynthesisUtterance("問題。" + cleaned);
    currentUtterance.lang = 'ja-JP';
    currentUtterance.rate = SPEECH_RATE;
    currentUtterance.onend = () => {
        if (document.getElementById("answerSection").style.display === "none") stopDisplay();
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
        if (count <= 0) { clearInterval(countdownInterval); revealAnswer(); }
        else document.getElementById("countdown").innerText = count + "秒";
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
    if (autoTimer) clearTimeout(autoTimer);
    speechSynthesis.cancel();
    document.getElementById("question").innerText = "";
    document.getElementById("answerText").innerText = "";
    document.getElementById("answerSection").style.display = "none";
    document.getElementById("judgeButtons").style.display = "none";
}

function enableButtons() {
    document.getElementById("nextBtn").disabled = false;
}

/**
 * ロック画面等のメディア制御連携
 */
function updateMediaSession(title, artist) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title, artist: artist, album: '早押しクイズ',
            artwork: [{ src: 'https://dummyimage.com/512x512/4caf50/fff&text=Quiz', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('pause', () => togglePause());
        navigator.mediaSession.setActionHandler('play', () => togglePause());
    }
}

/**
 * 検索オーバーレイの初期化
 */
function initSearch() {
    const overlay = document.getElementById("searchOverlay");
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    document.getElementById("openSearchBtn").addEventListener("click", () => {
        overlay.style.display = "block";
        input.focus();
    });
    document.getElementById("closeSearchBtn").addEventListener("click", () => {
        overlay.style.display = "none";
    });
    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const all = Storage.loadAll();
        if (!query) { results.innerHTML = ""; return; }
        const filtered = all.filter(q => q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query));
        results.innerHTML = filtered.map(q => `
            <div style="border-bottom:1px solid #eee; padding:10px 0;">
                <div style="font-size:0.9em; color:#333;">${q.question}</div>
                <div style="font-weight:bold; color:#4CAF50;">答: ${q.answer}</div>
            </div>
        `).join("") || "一致なし";
    });
}

// ボタンイベントの紐付け
document.getElementById("modeTextBtn").addEventListener("click", () => switchMode('text'));
document.getElementById("modeVoiceBtn").addEventListener("click", () => switchMode('voice'));
document.getElementById("modeAutoBtn").addEventListener("click", () => switchMode('auto'));
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
document.getElementById("buzzBtn").addEventListener("click", stopDisplay);
document.getElementById("showAnswerBtn").addEventListener("click", revealAnswer);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);
document.getElementById("correctBtn").addEventListener("click", showNextQuestion);
document.getElementById("retry1Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 0); showNextQuestion(); });
document.getElementById("retry10Btn").addEventListener("click", () => { QuizEngine.retry(currentQ, 10); showNextQuestion(); });

// CSVファイル読み込み処理
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
    if (confirm("進捗をリセットして最初からやり直しますか？")) {
        if (QuizEngine.init()) { isFirstQuestion = true; showNextQuestion(); }
    }
});