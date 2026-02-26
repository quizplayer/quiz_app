const Storage = {
    KEYS: {
        ALL: "quiz_all_questions",
        CURRENT: "quiz_questions",
        FILENAME: "quiz_filename",
        MODE: "quiz_mode",
        SHUFFLE: "quiz_shuffle",
        START_INDEX: "quiz_start_index",
        FAVORITES_MAP: "quiz_favorites_map",
        FAV_ONLY_MODE: "quiz_fav_only_mode"
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
    saveFileName(name) { localStorage.setItem(this.KEYS.FILENAME, name); },
    getFileName() { return localStorage.getItem(this.KEYS.FILENAME) || ""; },
    saveMode(mode) { localStorage.setItem(this.KEYS.MODE, mode); },
    getMode() { return localStorage.getItem(this.KEYS.MODE) || "text"; },
    saveShuffleSetting(isShuffle) { localStorage.setItem(this.KEYS.SHUFFLE, isShuffle); },
    getShuffleSetting() {
        const val = localStorage.getItem(this.KEYS.SHUFFLE);
        return val === null ? true : val === "true";
    },
    saveStartIndex(index) { localStorage.setItem(this.KEYS.START_INDEX, index); },
    getStartIndex() { return parseInt(localStorage.getItem(this.KEYS.START_INDEX) || "1"); },

    // お気に入り (ファイル名と紐付け)
    saveFavorites(favList) {
        const fileName = this.getFileName() || "default";
        const allFavs = JSON.parse(localStorage.getItem(this.KEYS.FAVORITES_MAP) || "{}");
        allFavs[fileName] = favList;
        localStorage.setItem(this.KEYS.FAVORITES_MAP, JSON.stringify(allFavs));
    },
    getFavorites() {
        const fileName = this.getFileName() || "default";
        const allFavs = JSON.parse(localStorage.getItem(this.KEYS.FAVORITES_MAP) || "{}");
        return allFavs[fileName] || [];
    },
    saveFavOnlyMode(isFavOnly) { localStorage.setItem(this.KEYS.FAV_ONLY_MODE, isFavOnly); },
    getFavOnlyMode() { return localStorage.getItem(this.KEYS.FAV_ONLY_MODE) === "true"; }
};