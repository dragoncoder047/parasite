class Goal {
    /**
     * @param {(level: Level) => boolean} evaluator
     */
    constructor(evaluator) {
        /**
         * @type {(level: Level) => boolean}
         */
        this.evaluator = evaluator;
        /**
         * @type {boolean}
         */
        this.beaten = false;
    }
    get complete() {
        return this.beaten;
    }
    evaluate(level) {
        if (!this.beaten && this.evaluator(level)) this.beaten = true;
    }
}
