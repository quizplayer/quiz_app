const Storage = {
    KEYS: {
        ALL: "all_questions",
        CURRENT: "quiz_questions",
        FILENAME: "quiz_filename",
        MODE: "quiz_mode" // 追加
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
    },

    // モード保存・取得用
    saveMode(mode) {
        localStorage.setItem(this.KEYS.MODE, mode);
    },

    getMode() {
        return localStorage.getItem(this.KEYS.MODE) || "text"; // デフォルトは画面表示
    }
};