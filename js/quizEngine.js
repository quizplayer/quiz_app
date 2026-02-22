const QuizEngine = {
    questions: [],

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // 起動時の初期化（リセットしてシャッフル）
    init() {
        const all = Storage.loadAll();
        if (all.length > 0) {
            this.questions = this.shuffle([...all]); // 全問復活させてシャッフル
            Storage.saveCurrentProgress(this.questions);
        }
    },

    getNext() {
        if (this.questions.length === 0) return null;
        return this.questions.shift();
    },

    // 指定位置に問題を差し戻す
    retry(questionObj, offset) {
        const pos = Math.min(offset, this.questions.length);
        this.questions.splice(pos, 0, questionObj);
        Storage.saveCurrentProgress(this.questions);
    }
};