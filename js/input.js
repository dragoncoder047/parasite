class IOStack {
    constructor() {
        /**
         * @type {InputCtx}
         */
        this.stack = [];
    }
    /**
     * @param {InputCtx} c
     * @returns {boolean}
     */
    hasControl(c) {
        return this.stack[this.stack.length - 1] === c;
    }
    /**
     * @param {InputCtx} c
     */
    push(c) {
        this.stack.push(c);
    }
    /**
     * @returns {InputCtx}
     */
    pop() {
        return this.stack.pop();
    }
}

class InputCtx {
    /**
     * @param {IOStack} stack
     * @param {...Control} controls
     */
    constructor(stack, ...controls) {
        /**
         * @type {IOStack}
         */
        this.iostack = stack;
        /**
         * @type {Control[]}
         */
        this.controls = controls;
    }
    /**
     * @returns {boolean}
     */
    hasControl() {
        return this.iostack.hasControl(this);
    }
    takeControl() {
        var old = this.iostack.stack[this.iostack.stack.length - 1];
        this.iostack.push(this);
        old.controls.forEach(c => c.enableCapture(false));
        this.controls.forEach(c => c.enableCapture(true));
    }
    returnControl() {
        if (this.hasControl()) {
            this.controls.forEach(c => c.enableCapture(false));
            var old = this.iostack.pop();
            old.controls.forEach(c => c.enableCapture(true));
        }
    }
    /**
     * @returns {any[]}
     */
    getInputs() {
        return this.hasControl() ? this.controls.flatMap(c => c.query()) : [];
    }
    /**
     * @param {any} o
     */
    sendOutput(o) {
        if (!this.hasControl()) return;
        this.controls.forEach(c => c.processOutput(o));
    }
}

class Control extends XEventEmitter {
    /**
     * @abstract
     * @returns {any[]}
     */
    query() {
        throw new Error("abstract method called");
    }
    /**
     * @abstract
     * @param {any} o
     */
    processOutput(o) {
        // default action is nothing
    }
    /**
     * @abstract
     * @param {boolean} yes
     */
    enableCapture(yes) {
        // nothing
    }
}

class MultiControl extends Control {
    /**
     * @param  {...Control} controls
     */
    constructor(...controls) {
        super();
        /**
         * @type {Control[]}
         */
        this.controls = controls;
    }
    query() {
        return this.controls.flatMap(c => c.query());
    }
    processOutput(o) {
        this.controls.forEach(c => c.processOutput(o));
    }
    enableCapture(x) {
        this.controls.forEach(c => c.enableCapture(x));
    }
}
