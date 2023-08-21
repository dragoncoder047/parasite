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
        /**
         * @type {Canvas}
         */
        this.canvas = new Canvas(this.mainElement);
        /**
         * @type {Level[]}
         */
        this.levels = opts.levels;
        /**
         * @type {number}
         */
        this.currentLevelIndex = 0;
        /**
         * @type {Snake}
         */
        this.playerSnake = new Snake(new Brain(), new Vector(0, 0));
    }
    //////////////////////////////////////////////////////
    /**
     * @param {string} message
     * @param {"info" | "warning" | "error" | "success" | false} [type=false] The dialog type
     */
    message(message, type) {
        this.toaster.toast(message, type);
    }
    /**
     * utility function
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
     * @type {Level}
     * @readonly
     */
    get currentLevel() {
        return this.levels[this.currentLevelIndex];
    }
    /////////////////////////////////////////////////////////
    showLevelCompleteToast() {
        var span = document.createElement("span");
        var button = document.createElement("button");
        button.addEventListener("click", () => this.nextLevel());
        button.textContent = "Next level \u21d2";
        span.append("Level complete!\u2001", button);
        this.toaster.toast(span, "success", true);
    }
    /**
     * start the main loop
     */
    startMainLoop() {
        var render = Matter.Render.create({
            canvas: this.canvas.canvas,
            engine: this.currentLevel.physicsEngine,
            options: {
                width: undefined,
                height: undefined,
                wireframes: false,
                showSleeping: false,
            }
        });
        Matter.Render.run(render);
        Matter.Events.on(render, "afterRender", () => Matter.Render.lookAt(render, Matter.Composite.allBodies(this.currentLevel.physicsWorld)));
        setInterval(() => this.tickWorld(), 1000 / 60);
    }
    /**
     * Called after each step
     */
    tickWorld() {
        this.message("postStep " + this.currentLevel.physicsEngine.timing.timestamp.toFixed());
        this.currentLevel.tickWorld();
    }
}
