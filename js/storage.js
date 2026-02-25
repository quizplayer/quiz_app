const Storage = {
    KEYS: {
        ALL: "all_questions",
        CURRENT: "quiz_questions",
        FILENAME: "quiz_filename",
        MODE: "quiz_mode",
        SHUFFLE: "quiz_shuffle" // 追加
    },

    saveAll(data) {
        localStorage.setItem(this.KEYS.ALL, JSON.stringify(data));
        localStorage.setItem(this.KEYS.CURRENT, JSON.stringify(data));
    },

    saveCurrentProgress(questions) {
        localStorage.setItem(this.KEYS.CURRENT, JSON.stringify(questions));
    },

    loadAll() {
        return JSON.parse(localStorage.getItem(this.KEYS.ALL) || "[]");
    },

    saveFileName(name) {
        localStorage.setItem(this.KEYS.FILENAME, name);
    },

    getFileName() {
        return localStorage.getItem(this.KEYS.FILENAME) || "";
    },

    saveMode(mode) {
        localStorage.setItem(this.KEYS.MODE, mode);
    },

    getMode() {
        return localStorage.getItem(this.KEYS.MODE) || "text";
    },

    // シャッフル設定の保存・取得
    saveShuffle(isEnabled) {
        localStorage.setItem(this.KEYS.SHUFFLE, isEnabled);
    },

    getShuffle() {
        const val = localStorage.getItem(this.KEYS.SHUFFLE);
        return val === null ? true : val === "true"; // デフォルトON
    }
};
