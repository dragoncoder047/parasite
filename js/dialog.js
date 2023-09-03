class Dialog extends XEventEmitter {
    /**
     * @param {HTMLDialogElement?} elem
     * @param {string | false} closeButtonMessage
     */
    constructor(elem, closeButtonMessage = "close") {
        super();
        if (!elem) {
            elem = document.createElement("dialog");
            elem.classList.add("big");
            document.body.append(elem);
        }
        /**
         * @type {HTMLDialogElement}
         */
        this.elem = elem;
        this.elem.addEventListener("close", () => this.emit("close", this.elem.returnValue));
        this.elem.addEventListener("keydown", e => { if (e.key == "Escape") e.preventDefault(); });
        // move elemnts to span
        /**
         * @type {HTMLDivElement}
         */
        this.inside = document.createElement("div");
        this.inside.append(...this.elem.childNodes);
        this.elem.append(this.inside);
        if (closeButtonMessage) {
            var form = document.createElement("form");
            form.method = "dialog";
            var button = document.createElement("input");
            button.type = "submit";
            button.value = closeButtonMessage;
            form.append(button);
            this.elem.append(form);
        }
    }
    show() {
        if (!this.open) {
            this.elem.inert = true;
            this.elem.showModal();
            this.elem.inert = false;
        }
    }
    close() {
        if (this.open) this.elem.close();
    }
    /**
     * @param {string | HTMLElement} content
     */
    setContent(content) {
        if (typeof content == "string") this.inside.innerHTML = content;
        else {
            this.inside.innerHTML = "";
            this.inside.append(content);
        }
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get open() {
        return this.elem.open;
    }
}
