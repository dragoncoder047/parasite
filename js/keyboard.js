
/**
 * @typedef {"while-held" | "once" | "auto-repeat" | "toggle"} KeyMode
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
            if (!this.capturing) return;
            if (e.key !== this.key) return;
            e.preventDefault();
            if (!this.down) {
                this.emit("press");
                this.down = true;
                this.edge = true;
            } else {
                this.emit("repeat");
                if (this.mode === "auto-repeat") this.edge = true;
            }
        });
        document.body.addEventListener("keyup", e => {
            if (!this.capturing) return;
            if (e.key !== this.key) return;
            e.preventDefault();
            this.down = false;
            this.emit("up");
        });
        this.result = result;
        /**
         * @type {KeyMode}
         */
        this.mode = mode;
        /**
         * @type {boolean}
         */
        this.capturing = false;
    }
    query() {
        switch (this.mode) {
            case "while-held":
                return this.down ? [this.result] : [];
            case "once":
            case "auto-repeat":
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
    enableCapture(x) {
        this.capturing = x;
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
    enableCapture(x) {
        this.controls.forEach(c => c.enableCapture(x));
    }
}
