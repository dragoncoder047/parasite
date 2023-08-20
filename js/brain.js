class BrainInput {
    constructor() {
        /**
         * 5 inputs
         * @type {[number, number, number, number, number]}
         */
        this.wallDistances = [-1, -1, -1, -1, -1];
        /**
         * 5 inputs per snake * 5 snakes = 25 inputs
         * @type {[Snake, Snake, Snake, Snake, Snake]}
         */
        this.trackedSnakes = [null, null, null, null, null];
        /**
         * 2 inputs
         * @type {[number, number]}
         */
        this.wallContacts = [-1, -1];
        /**
         * 1 input
         * @type {boolean}
         */
        this.tailMating = false;
        /**
         * 1 input
         * @type {boolean}
         */
        this.headMating = true;
        /**
         * 5 directions * distance * amount = 5 inputs
         * @type {[number, number, number, number, number]}
         */
        this.foodBins = [0, 0, 0, 0, 0];
    }
}

class BrainOutput {
    constructor() {

    }
}

class Brain {
    /**
     * @abstract
     * @param {BrainInput} data
     */
    input(data) {
        throw new Error("NotImplementedError");
    }
    /**
     * @abstract
     * @returns {BrainOutput}
     */
    think() {
        throw new Error("NotImplementedError");
    }
}
