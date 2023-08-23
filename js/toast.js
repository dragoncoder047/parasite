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
     * @param {string | HTMLElement} message
     * @param {"info" | "warning" | "error" | "success" | false} type The dialog type
     * @param {boolean} permanent Don't auto-close
     */
    show(message, type = false, permanent = false) {
        this.dialog.innerHTML = "";
        this.dialog.append(message);
        if (type) this.dialog.dataset.information = type;
        else delete this.dialog.dataset.information;
        if (this.timeout) clearTimeout(this.timeout);
        this.dialog.inert = true;
        this.dialog.show();
        this.dialog.inert = false;
        if (!permanent) {
            this.timeout = setTimeout(() => {
                this.dialog.close();
                this.timeout = null;
            }, this.delay);
        }
    }
    /**
     * Hide a permanent toast.
     */
    close() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.dialog.close();
    }
}
