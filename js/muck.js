/**
 * @typedef {Object} MuckParam
 * @property {string?} fullName
 * @property {string?} description
 * @property {"string" | "number" | "boolean"} type
 * @property {string | number | boolean} value
 * @property {string[]?} choices
 * @property {number?} step
 * @property {[number, number]} limits
 */


class Muckable {
    constructor(stack, controls) {
        /**
         * @type {Object<string, MuckParam>}
         */
        this.v = {};
        /**
         * @type {Dialog}
         */
        this.d = new Dialog();
        /**
         * @type {InputCtx}
         */
        this.ctx = new InputCtx(stack, controls);
        /**
         * @type {{p2: HTMLElement, m: MuckParam, i: HTMLElement}[]}
         */
        this.p2 = [];
        /**
         * @type {number}
         */
        this.p2i = 0;
    }
    /**
     * @param {string} name
     * @returns {string | number | boolean}
     */
    get(name) {
        if (!(name in this.v)) throw new Error(name + " is not defined");
        return this.v[name].value;
    }
    /**
     * @param {string} name
     * @param {any} value
     */
    set(name, value) {
        if (!(name in this.v)) throw new Error(name + " is not defined");
        var e = this.v[name];
        // validate
        switch (e.type) {
            case "string":
                if (typeof value !== "string") throw new Error("not a string");
                if (e.choices && e.choices.indexOf(value) === -1) throw new Error("invalid choice");
                break;
            case "boolean":
                if (!!value !== value) throw new Error("not a boolean");
                break;
            case "number":
                if (typeof value !== "number") throw new Error("not a number");
                if (value < e.limits[0] || value > e.limits[1]) throw new Error("out of range");
                break;
            default:
                throw new Error("strange type");
        }
        e.value = value;
    }
    /**
     * @param {string} name
     * @param {MuckParam} schema
     */
    define(name, schema) {
        if (name in this.v) throw new Error(name + " is already defined");
        this.v[name] = schema;
    }
    /**
     * opens the dialog to allow mucking by user
     */
    muck() {
        this.loadInputs();
        this.d.show();
        this.ctx.takeControl();
        this.p2i = 0;
        this.interactLoop();
    }
    loadInputs() {
        this.d.setContent("");
        var es = [];
        this.p2 = [];
        Object.keys(this.v).forEach(p => {
            var s = this.v[p];
            var r = document.createElement("div");
            es.push(r);
            if (s.description) {
                r.classList.add("flex-column");
                var desc = document.createElement("span");
                desc.append(s.description);
                desc.style.fontStyle = "italic";
                desc.style.opacity = CSS.percent(50);
                desc.style.marginLeft = CSS.em(3);
                desc.style.fontStyle = "italic";
                var top = document.createElement("div");
                top.style.padding = 0;
                r.append(top, desc);
                r = top;
            }
            r.classList.add("flex-row");
            r.style.margin = CSS.em(1);
            var i, i2;
            switch (s.type) {
                case "string":
                    if (s.choices) {
                        i = document.createElement("select");
                        i.append(...s.choices.map(c => {
                            var e = document.createElement("option");
                            e.value = e.textContent = c;
                            return e;
                        }));
                        i.value = s.value;
                    } else {
                        i = document.createElement("input");
                        i.type = "text";
                        i.value = s.value;
                    }
                    break;
                case "boolean":
                    i = document.createElement("input");
                    i.type = "checkbox";
                    i.checked = s.value;
                    break;
                case "number":
                    i = document.createElement("input");
                    i.type = "number";
                    if (s.limits) {
                        i2 = document.createElement("input");
                        i2.type = "range";
                        if (s.step) i2.step = s.step;
                        i.min = i2.min = s.limits[0];
                        i.max = i2.max = s.limits[1];
                        i2.value = s.value;
                        i.addEventListener("input", () => {
                            i2.value = i.value;
                        });
                        i2.addEventListener("input", () => {
                            i.value = i2.value;
                            i.dispatchEvent(new InputEvent("input"));
                        });
                    }
                    i.value = s.value;
                    if (s.step) i.step = s.step;
                    break;
                default:
                    throw new Error("strange type");
            }
            i.style.flex = 1;
            i.addEventListener("input", () => {
                s.value = i.type === "checkbox" ? i.checked : i.type === "number" ? +i.value : i.value;
            });
            // Allow the user to type in the box without controls being intercepted.
            // this also disables escape key to get out of the modal and return to the game, but
            // if they clicked in the box they can click out of it too :)
            i.addEventListener("focus", () => this.ctx.enableCapture(false));
            i.addEventListener("blur", () => this.ctx.enableCapture(true));
            var p2ind = document.createElement("span");
            p2ind.style.width = CSS.em(1);
            p2ind.style.setProperty("text-align", "right");
            r.append(p2ind, s.name || camel2words(p), ": ", i);
            if (i2) r.append(i2);
            this.p2.push({ p2: p2ind, m: s, i });
        });
        this.d.inside.append(...es);
        this.d.inside.classList.add("flex-column");
    }
    async interactLoop() {
        while (this.d.open) {
            await new Promise(r => requestAnimationFrame(r));
            this.ctx.getInputs().forEach(i => {
                switch (i) {
                    case "next":
                        this.p2i = clamp(this.p2i + 1, 0, this.p2.length - 1);
                        break;
                    case "prev":
                        this.p2i = clamp(this.p2i - 1, 0, this.p2.length - 1);
                        break;
                    case "inc":
                        this.changeValue(1);
                        break;
                    case "dec":
                        this.changeValue(-1);
                        break;
                    case "exit":
                        this.d.close();
                        break;
                    default:
                        throw new Error("strange action " + i);
                }
            });
            // show currently selected parameter
            this.p2.forEach((p, i) => {
                p.p2.textContent = i === this.p2i ? "\u2b9e" : "";
            });
            this.p2[this.p2i].p2.scrollIntoView();
        }
        this.ctx.returnControl();
        for (var p in this.v) delete this.v[p]._p2ind;
        this.p2 = [];
    }
    changeValue(how) {
        var e = this.p2[this.p2i];
        switch (e.m.type) {
            case "string":
                if (e.m.choices) {
                    var z = clamp(e.m.choices.indexOf(e.i.value) + how, 0, e.m.choices.length - 1);
                    e.i.value = e.m.choices[z];
                }
                break;
            case "number":
                e.i.value = +e.i.value + how * (+e.i.step || 1);
                if (e.m.limits) e.i.value = clamp(e.i.value, e.m.limits[0], e.m.limits[1]);
                break;
            case "boolean":
                e.i.checked = !e.i.checked;
                break;
            default:
                throw new Error("strange type");
        }
        e.i.dispatchEvent(new InputEvent("input"));
    }
}
