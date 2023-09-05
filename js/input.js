class IOStack {
    constructor() {
        /**
         * @type {InputCtx[]}
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
     * @returns {InputCtx | undefined}
     */
    pop() {
        return this.stack.pop();
    }
    /**
     * @returns {InputCtx | undefined}
     */
    current() {
        return this.stack[this.stack.length - 1];
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
        var old = this.iostack.current();
        this.iostack.push(this);
        if (old !== undefined) old.enableCapture(false);
        this.enableCapture(true);
    }
    returnControl() {
        if (!this.hasControl()) throw new Error("weird state corruption");
        this.enableCapture(false);
        this.iostack.pop();
        var old = this.iostack.current();
        if (old !== undefined) old.enableCapture(true);
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
    /**
     * @param {boolean} x
     */
    enableCapture(x) {
        this.controls.forEach(c => c.enableCapture(x));
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
