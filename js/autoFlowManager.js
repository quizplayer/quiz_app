const AutoFlowManager = {
    timer: null,
    interval: 1000,

    start(questionObj, onAnswerStart, onQuestionEnd, onCycleComplete) {
        this.stop();
        
        const cleanedQ = AudioPlayer.cleanText(questionObj.question);
        AudioPlayer.play("問題。" + cleanedQ, null, () => {
            if (onQuestionEnd) onQuestionEnd();
            
            this.timer = setTimeout(() => {
                AudioPlayer.play("答え。" + questionObj.answer, () => {
                    if (onAnswerStart) onAnswerStart();
                }, () => {
                    this.timer = setTimeout(() => {
                        if (onCycleComplete) onCycleComplete();
                    }, this.interval);
                });
            }, this.interval);
        });
    },

    stop() {
        if (this.timer) clearTimeout(this.timer);
        AudioPlayer.stop();
    }
};