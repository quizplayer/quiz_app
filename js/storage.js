const Storage = {
    KEYS: {
        ALL: "all_questions",
        CURRENT: "quiz_questions",
        FILENAME: "quiz_filename"
    },

    // データの保存（読み込み時）
    saveAll(data) {
        localStorage.setItem(this.KEYS.ALL, JSON.stringify(data));
        localStorage.setItem(this.KEYS.CURRENT, JSON.stringify(data));
    },

    // 進行状況の保存
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
    }
};