class IODevice extends XEventEmitter {
    constructor() {
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
        throw new Error("abstract method called");
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
}

class InputDispatcher {
    /**
     * @param  {...IODevice} sources
     */
    constructor(...sources) {
        sources.forEach(source => source.dispatchTo(this));
        /**
         * @type {InputListener[]}
         */
        this.trxStack = [];
    }
    dispatchInput(input) {
        var t = this.trxStack[this.trxStack.length - 1];
        if (t) t.emit("input", input);
    }
    pushContext(l) {
        this.trxStack.push(l);
    }
    popContext() {
        this.trxStack.pop();
    }
}

class InputListener extends XEventEmitter {
    constructor(queue, transformers) {
        super();
        transformers.forEach(t => t.transform(this));
        this.source = queue;
        this.tQ = [];
    }
    discardOutOfDate() {
        var now = Date.now();
        // max 20 ms latency
        while (this.tQ.length && now - this.tQ[0].timestamp > 20) this.tQ.shift();
    }
    /**
     * @returns {string?}
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
}

class Keyboard extends IODevice {
    constructor() {
        super();
        this.keysDown = {};
        document.body.addEventListener("keydown", e => {
            this.keysDown[e.key] = true;
            this.dispatch("keydown", e.key);
        });
        document.body.addEventListener("keyup", e => {
            delete this.keysDown[e.key];
            this.dispatch("keyup", e.key);
        });
    }
}
