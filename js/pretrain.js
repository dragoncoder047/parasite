/**
 * @typedef {(l: Level, b: NNBrain, s: Snake) => Promise<void>} SetupCB
 */

/**
 * @typedef {(l: Level, b: NNBrain, s: Snake) => Promise<void>} RunCB
 */

class PretrainPhase {
    /**
     * @param {string} name
     * @param {SetupCB} setup
     * @param {RunCB} run
     */
    constructor(name, setup, run) {
        /**
         * @type {string}
         */
        this.name = name;
        /**
         * @type {SetupCB}
         */
        this.setup = setup;
        /**
         * @type {RunCB}
         */
        this.run = run;
    }
    /**
     * @param {NNBrain} brain
     * @param {number} rounds
     * @param {Dialog} dialog
     */
    async train(brain, rounds, dialog) {
        var s = new Snake(brain, Vector.zero(), null, null, "pretrainer");
        var l = new Level({ snakes: [s] });
        var bar = document.createElement("progress");
        bar.max = rounds;
        var row = document.createElement("p");
        row.append(camel2words(this.name), ": ", bar);
        row.scrollIntoView();
        dialog.inside.append(row);
        await this.setup(l, brain, s);
        bar.value = 0;
        for (var i = 0; i < rounds; i++) {
            await this.run(l, brain, s);
            bar.value = i;
            await new Promise(requestAnimationFrame);
        }
        bar.remove();
        row.append("\u2713 DONE");
    }
}

class Pretrainer {
    /**
     * @param  {...PretrainPhase} trainers
     */
    constructor(...trainers) {
        /**
         * @type {Dialog}
         */
        this.dialog = new Dialog(null, false);
        /**
         * @type {PretrainPhase[]}
         */
        this.trainers = trainers;
        /**
         * @type {NNBrain}
         */
        this.brain = new NNBrain();
    }
    /**
     * @param {number} rounds
     */
    async run(rounds = 1000) {
        this.dialog.setContent("# Pretraining neural network...");
        this.dialog.show();
        for (var t of this.trainers) {
            await t.train(this.brain, rounds, this.dialog);
        }
        this.dialog.close();
    }
}
