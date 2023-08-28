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

class IODevice extends XEventEmitter {
    /**
     * @abstract
     * @param {Output}
     */
    reactToOutput(out) {
        // default action is nothing
    }
    /**
     * @param {string} name
     * @param {any} detail
     */
    dispatch(name, detail) {
        this.emit("input", new Input(name, detail));
    }
}

class IOStack {
    /**
     * @param  {...IODevice} inputSources
     */
    constructor(...inputSources) {
        this.inputSources = inputSources;
        inputSources.forEach(src =>
            src.on("input", e => this.handleInput(e.detail)));
        /**
         * @type {InputCtx}
         */
        this.stack = [];
    }
    /**
     * @param {Input} d
     */
    handleInput(d) {
        if (this.stack) this.stack[this.stack.length - 1].emit("input", d);
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
     * @param {Control[]} controls
     */
    constructor(stack, controls) {
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

class Control {
    /**
     * @param {IODevice} source
     */
    constructor(source) {
        /**
         * @type {IODevice}
         */
        this.device = source;
    }
    /**
     * @abstract
     * @returns {any[]}
     */
    query() {
        throw new Error("abstract method called");
    }
}

class MultiControl extends Control {
    constructor(...controls) {
        super(null);
        /**
         * @type {Control[]}
         */
        this.controls = controls;
    }
    query() {
        return this.controls.flatMap(c => c.query());
    }
}

class Keyboard extends IODevice {
    constructor() {
        super();
        document.body.addEventListener("keydown", e => {
            e.preventDefault();
            this.dispatch("keydown", e.key)
        });
        document.body.addEventListener("keyup", e => {
            e.preventDefault();
            this.dispatch("keyup", e.key)
        });
    }
}

class Key extends Control {
    /**
     * @param {Keyboard} kbd
     * @param {string} key
     * @param {any} result
     * @param {"hold" | "once" | "toggle"} mode
     */
    constructor(kbd, key, result, mode) {
        super(kbd);
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
        this.device.on("input", i => {
            if (i.detail !== this.key) return;
            if (i.name === "keydown" && !this.down) {
                this.emit("press");
                this.down = true;
                this.edge = true;
            }
            else if (i.name === "keyup") {
                this.down = false;
            }
        });
        this.result = result;
        /**
         * @type {"hold" | "once" | "toggle"}
         */
        this.mode = mode;
        if (mode !== "hold")
    }
    query() {
        switch (this.mode) {
            case "hold":
                return this.down ? [this.result] : [];
            case "once":
                var res = this.edge ? [this.result] : [];
                this.edge = false;
                return res;
            case "toggle":
                if (this.edge) this.state = = !this.state;
                this.edge = false;
                return this.state ? [this.result] : [];
            default:
                throw new Error("strange mode " + this.mode);
        }
    }
}

class Keymap extends Control {
    /**
     * 
     * @param {Keyboard} kbd 
     * @param {[string, string, any][]} map 
     */
    constructor(kbd, map) {
        super(kbd);
        /**
         * @type {Key[]}
         */
        this.keys = [];
        for (var [key, mode, action] of map) {
            this.keys.push(new Key(kbd, key, action, mode));
        }
    }
    query() {
        return this.keys.flatMap(k => k.query());
    }
}
