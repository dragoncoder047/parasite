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
         * @type {Popover}
         */
        this.d = new Popover();
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
     * opens the popover to allow mucking by user
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
        for (var p in this.v) {
            var s = this.v[p];
            var r = document.createElement("div");
            es.push(r);
            if (s.description) {
                r.classList.add("flex-column");
                var desc = document.createElement("span");
                desc.append(s.description);
                desc.style.setProperty("font-style", "italic");
                var top = document.createElement("div");
                r.append(top, desc);
                r = top;
            }
            r.classList.add("flex-row");
            var i, i2;
            switch (s.type) {
                case "string":
                    if (s.choices) {
                        i = document.createElement("select");
                        i.append(...s.choices.map(c => {
                            var e = documen.createElement("option");
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
                        i.min = i2.min = s.limits[0];
                        i.max = i2.max = s.limits[1];
                        i2.value = s.value;
                        i.addEventListener("input", () => {
                            i2.value = i.value;
                            i2.dispatchEvent(new Event("input"));
                        });
                        i2.addEventListener("input", () => {
                            i.value = i2.value
                            i.dispatchEvent(new Event("input"));
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
                s.value = i.type === "checkbox" ? i.checked : i.value;
            });
            var p2ind = document.createElement("span");
            p2ind.style.width = CSS.em(1);
            p2ind.style.setProperty("text-align", "right");
            r.append(p2ind, s.name, ": ", i);
            if (i2) r.append(i2);
            this.p2.push({ p2: p2ind, m: s, i });
        }
        this.d.inside.append(...es);
        this.d.inside.classList.add("flex-column");
    }
    async interactLoop() {
        while (this.d.open) {
            await new Promise(r => requestAnimationFrame(r));
            this.ctx.getInputs().forEach(i => {
                switch (i) {
                    case "next":
                        this.p2i = clamp(this.p2i + 1, 0, this.p2.length);
                        break;
                    case "prev":
                        this.p2i = clamp(this.p2i - 1, 0, this.p2.length);
                        break;
                    case "inc":
                        this.changeValue(1);
                        break;
                    case "dec":
                        this.changeValue(-1);
                        break;
                    default:
                        throw new Error("strange action " + i);
                }
            });
            // show currently selected parameter
            this.p2.forEach((p, i) => {
                p.p2.textContent = i === this.p2i ? "\u2b9e" : "";
            });
        }
        this.ctx.returnControl();
        for (var p of this.v) delete p._p2ind;
        this.p2 = [];
    }
    changeValue(how) {
        var e = this.p2[this.p2i];
        switch (e.m.type) {
            case "string":
                if (e.m.choices) {
                    var z = clamp(e.m.choices.indexOf(e.i.value) + how, 0, e.m.choices.length);
                    e.i.value = e.m.choices[z];
                }
                break;
            case "number":
                e.i.value += how * (e.i.step || 1);
                break;
            case "boolean":
                e.i.checked = !e.i.checked;
                break;
            default:
                throw new Error("strange type");
        }
        e.i.dispatchEvent(new Event("input"));
    }
}
