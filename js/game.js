class ParasiteGame {
    constructor(opts) {
        /**
         * @type {HTMLElement}
         */
        this.mainElement = opts.main;
        /**
         * @type {Object<string, HTMLDialogElement>}
         */
        this.popovers = opts.popovers;
        /**
         * @type {string[]}
         */
        this.popoverNames = Object.keys(opts.popovers);
        /**
         * @type {Toast}
         */
        this.toaster = new Toast();
    }
    //////////////////////////////////////////////////////
    /**
     * @param {string} message
     */
    toast(message) {
        this.toaster.toast(message);
    }
    /**
     * @param {number} delay
     * @returns {Promise<void>}
     */
    sleep(delay) {
        return new Promise(r => setTimeout(r, delay));
    }
    /**
     * @param {string|false} name
     */
    showPopover(name) {
        for (var pop of this.popoverNames) {
            var elem = this.popovers[pop];
            if (pop == name) {
                if (!elem.hasAttribute("open")) elem.showModal();
            } else {
                if (elem.hasAttribute("open")) elem.close();
            }
        }
    }
    /////////////////////////////////////////////////////////
    /**
     * run the main loop. does not return.
     * @return {Promise<never>}
     */
    async mainloop() {

    }
}
