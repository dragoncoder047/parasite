class ParasiteGame extends XEventEmitter {
    constructor(opts) {
        super();
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
        this.popoverNames.forEach(name => {
            var pop = this.popovers[name];
            pop.addEventListener("close", () => {
                this.emit("popover-" + name + "-closed");
                this.emit("popoverclosed");
            });
        });
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
        this.playerSnake.brain.mood[0] = { r: 255, g: 127, b: 0 };
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
                if (!elem.open) {
                    elem.inert = true;
                    elem.show();
                    elem.inert = false;
                }
            } else {
                if (elem.open) elem.close();
            }
        }
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get popoverActive() {
        return this.popoverNames.some(name => this.popovers[name].open);
    }
    /////////////////////////////////////////////////////////
    /**
     * @type {Level}
     * @readonly
     */
    get currentLevel() {
        return this.levels[this.currentLevelIndex];
    }
    showLevelCompleteToast() {
        var span = document.createElement("span");
        var button = document.createElement("button");
        button.addEventListener("click", () => this.nextLevel());
        button.textContent = "Next level \u21d2";
        span.append("Level complete!\u2001", button);
        this.toaster.toast(span, "success", true);
    }
    nextLevel() {
        this.openLevel(this.currentLevelIndex + 1);
    }
    /**
     * @param {number} index
     */
    openLevel(index) {
        // remove player snake from current level
        Matter.Composite.removeComposite(this.currentLevel.physicsWorld, this.playerSnake.segments);
        this.currentLevelIndex = index;
        Matter.Composite.addComposite(this.currentLevel.physicsWorld, this.playerSnake.segments);
        var cl = this.currentLevel;
        this.popovers.levelInfo.innerHTML = `
        <h1>Level ${this.currentLevelIndex}${": ".repeat(!!cl.title)}${cl.title}</h1>
        <div>${cl.objective}</div>
        <form method="dialog">
        <input type="submit" value="Play" autofocus="false" />
        </form>
        `;
        this.showPopover("levelInfo");
    }
    /////////////////////////////////////////////////////////
    /**
     * start the main loop
     */
    async mainLoop() {
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
        this.tickWorld();
    }
    /**
     * Called after each step
     */
    tickWorld() {
        this.currentLevel.tickWorld();
        if (this.currentLevel.complete) this.showLevelCompleteToast();
        // Don't run the level if a popover is open
        if (!this.popoverActive) setTimeout(() => this.tickWorld(), 1000 / 60);
        else this.waitFor("popoverclosed").then(() => this.tickWorld());
    }
}
