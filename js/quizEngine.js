const QuizEngine = {
    questions: [],
    totalCount: 0,

    parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentCell = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = "";
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (currentCell !== "" || currentRow.length > 0) {
                    currentRow.push(currentCell.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    currentCell = "";
                }
            } else { currentCell += char; }
        }
        if (currentCell !== "" || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
        }
        return rows;
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    init() {
        const all = Storage.loadAll();
        if (all.length > 0) {
            const isShuffle = Storage.getShuffleSetting();
            let processed = [...all];

            if (isShuffle) {
                processed = this.shuffle(processed);
            } else {
                const start = Math.max(0, Storage.getStartIndex() - 1);
                processed = processed.slice(start);
            }

            this.questions = processed;
            this.totalCount = all.length;
            Storage.saveCurrentProgress(this.questions);
            return true;
        }
        return false;
    },

    getNext() {
        return this.questions.length === 0 ? null : this.questions.shift();
    },

    getCurrentNumber() {
        return this.totalCount - this.questions.length;
    },

    retry(questionObj, offset) {
        const pos = Math.min(offset, this.questions.length);
        this.questions.splice(pos, 0, questionObj);
        Storage.saveCurrentProgress(this.questions);
    }
};