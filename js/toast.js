class Toast {
    /**
     * @param {number?} [delay=3000]
     */
    constructor(delay = 3000) {
        /**
         * @type {HTMLDialogElement}
         */
        this.dialog = document.createElement("dialog");
        this.dialog.classList.add("toast");
        document.body.append(this.dialog);
        /**
         * @type {number?}
         */
        this.timeout = null;
        /**
         * @type {number}
         * @default 3000
         */
        this.delay = delay;
    }
    /**
     * @param {string} message
     * @param {"info" | "warning" | "error" | "success" | false} [type=false] The dialog type
     */
    toast(message, type = false) {
        this.dialog.textContent = message;
        if (type) this.dialog.dataset.information = type;
        else delete this.dialog.dataset.information;
        if (this.timeout) clearTimeout(this.timeout);
        this.dialog.show();
        this.timeout = setTimeout(() => {
            this.dialog.close();
            this.timeout = null;
        }, this.delay);
    }
    close() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.dialog.close();
    }
}
