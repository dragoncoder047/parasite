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

/**
 * @typedef {"while-held" | "once" | "toggle"} KeyMode
 */

class Key extends Control {
    /**
     * @param {string} key
     * @param {any} result
     * @param {KeyMode} mode
     */
    constructor(key, result, mode) {
        super();
        /**
         * @type {string}
         */
        this.key = key;
        /**
         * @type {boolean}
         */
        this.down = false;
        /**
         * @type {boolean}
         */
        this.edge = false;
        /**
         * @type {boolean}
         */
        this.state = false;
        document.body.addEventListener("keydown", e => {
            if (e.key !== this.key) return;
            e.preventDefault();
            if (!this.down) {
                this.emit("press");
                this.down = true;
                this.edge = true;
            }
        });
        document.body.addEventListener("keyup", e => {
            if (e.key !== this.key) return;
            e.preventDefault();
            this.down = false;
        });
        this.result = result;
        /**
         * @type {KeyMode}
         */
        this.mode = mode;
    }
    query() {
        switch (this.mode) {
            case "while-held":
                return this.down ? [this.result] : [];
            case "once":
                var res = this.edge ? [this.result] : [];
                this.edge = false;
                return res;
            case "toggle":
                if (this.edge) this.state = !this.state;
                this.edge = false;
                return this.state ? [this.result] : [];
            default:
                throw new Error("strange mode " + this.mode);
        }
    }
}

class Keymap extends Control {
    /**
     * @param {[string, KeyMode, any][]} map 
     */
    constructor(map) {
        super();
        /**
         * @type {Key[]}
         */
        this.keys = [];
        for (var [key, mode, action] of map) {
            this.keys.push(new Key(key, action, mode));
        }
    }
    query() {
        return this.keys.flatMap(k => k.query());
    }
}
