const AudioPlayer = {
    speechRate: 1.0,
    play(text, onStart, onEnd) {
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ja-JP';
        utter.rate = this.speechRate;
        if (onStart) utter.onstart = onStart;
        if (onEnd) utter.onend = onEnd;
        speechSynthesis.speak(utter);
    },
    stop() { speechSynthesis.cancel(); },
    pause() { speechSynthesis.pause(); },
    resume() { speechSynthesis.resume(); },
    isPaused() { return speechSynthesis.paused; },
    cleanText(text) { return text.replace(/[(\（].*?[)\）]/g, ""); }
};