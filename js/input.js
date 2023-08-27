class IODevice extends XEventEmitter {
    constructor() {
        super();
        /**
         * @type {InputDispatcher}
         */
        this.target = null;
    }
    /**
     * @param {InputDispatcher} q
     */
    dispatchTo(q) {
        this.target = q;
    }
    dispatch(iname, detail) {
        this.target.dispatchInput(new Input(iname, detail));
    }
    /**
     * @abstract
     * @param {Output}
     */
    reactToOutput(out) {
        // default action is nothing
    }
}

class Input {
    /**
     * @param {string | number} action
     * @param {*} detail
     */
    constructor(action, detail) {
        /**
         * @type {string | number}
         */
        this.action = action;
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

class InputDispatcher {
    /**
     * @param  {...IODevice} sources
     */
    constructor(...sources) {
        sources.forEach(source => source.dispatchTo(this));
        /**
         * @type {IODevice[]}
         */
        this.sources = sources;
        /**
         * @type {InputListener[]}
         */
        this.trxStack = [];
        this.processOutput = this.processOutput.bind(this);
    }
    dispatchInput(input) {
        var t = this.trxStack[this.trxStack.length - 1];
        if (t) t.emit("input", input);
    }
    /**
     * @param {InputListener} l
     */
    pushContext(l) {
        this.trxStack.push(l);
        l.on("output", this.processOutput);
    }
    popContext() {
        var l = this.trxStack.pop();
        if (l) l.off("output", this.processOutput);
    }
    /**
     * @param {Output} o
     */
    processOutput(o) {
        this.sources.forEach(s => s.reactToOutput(o));
    }
}

class InputListener extends XEventEmitter {
    /**
     * @param {...InputTransformer} transformers
     */
    constructor(...transformers) {
        super();
        transformers.forEach(t => t.startTransforming(this));
        transformers.forEach(t => t.on("process", e => this.add(e.detail)));
        /**
         * @type {Input[]}
         */
        this.tQ = [];
    }
    discardOutOfDate() {
        var now = Date.now();
        // max 20 ms latency
        while (this.tQ.length && now - this.tQ[0].timestamp > 20) this.tQ.shift();
    }
    /**
     * @returns {Input?}
     */
    getNext() {
        this.discardOutOfDate();
        var i = this.tQ.shift();
        if (i) return i.action;
        return null;
    }
    /**
     * @param {Input} i
     */
    add(i) {
        this.queue.push(i);
    }
    /**
     * @param {Output} o
     */
    sendOutput(o) {
        this.emit("output", o);
    }
}

class InputTransformer extends XEventEmitter {
    /**
     * @param {InputListener} ln
     */
    startTransforming(ln) {
        /**
         * @type {InputListener}
         */
        this.listener = ln;
        ln.on("input", e => this.process(e.detail));
    }
    /**
     * @abstract
     * @param {Input} input
     * @returns {Input[]}
     */
    process(input) {
        throw new Error("abstract method called");
    }
}

class Keyboard extends IODevice {
    constructor() {
        super();
        document.body.addEventListener("keydown", e => this.dispatch("keydown", e.key));
        document.body.addEventListener("keyup", e => this.dispatch("keyup", e.key));
    }
}

class KeyRepeat extends InputTransformer {
    /**
     * @param {string} key
     * @param {any} emitWhileHeld
     * @param {number} interval
     */
    constructor(key, emitWhileHeld, interval = 100) {
        super();
        /**
         * @type {string}
         */
        this.key = key;
        this.emitWhileHeld = emitWhileHeld;
        /**
         * @type {number}
         */
        this.interval = interval;
        /**
         * @type {number?}
         */
        this.iid = null;
    }
    process(input) {
        if (input.detail === this.key) {
            if (input.action === "keydown") this.iid = setInterval(() => this.emit("process", this.emitWhileHeld), this.interval);
            else if (input.action === "keyup") clearInterval(this.iid);
        }
    }
}

class KeyOneShot extends InputTransformer {
    /**
     * @param {string} key
     * @param {any} output
     * @param {number} interval
     */
    constructor(key, output) {
        super();
        /**
         * @type {string}
         */
        this.key = key;
        this.output = output;
    }
    process(input) {
        if (input.detail === this.key) {
            if (input.action === "keydown") this.emit("process", this.output);
        }
    }
}
