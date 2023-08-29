class Input {
    /**
     * @param {string} name
     * @param {any} detail
     */
    constructor(name, detail) {
        /**
         * @type {string}
         */
        this.name = name;
        this.detail = detail;
        /**
         * @type {number}
         */
        this.timestamp = Date.now();
    }
}

class Output {
    // stub
    // what do I put here
}

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
    pop() {
        this.stack.pop();
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
        this.iostack.push(this);
    }
    returnControl() {
        if (this.hasControl()) this.iostack.pop();
    }
    /**
     * @returns {any[]}
     */
    getInputs() {
        return this.hasControl() ? this.controls.flatMap(c => c.query()) : [];
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
}
