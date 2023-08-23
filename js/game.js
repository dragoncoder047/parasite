class ParasiteGame extends XEventEmitter {
    constructor(opts) {
        super();
        /**
         * @type {HTMLElement}
         */
        this.mainElement = opts.main;
        /**
         * @type {Object<string, Popover>}
         */
        this.popovers = opts.popovers;
        Object.keys(this.popovers).forEach(name => this.popovers[name].pipeTo("close", this, "popoverclose"));
        /**
         * @type {Popover}
         */
        this.levelInfoPopover = new Popover(null, "Play");
        this.levelInfoPopover.pipeTo("close", this, "popoverclose");
        /**
         * @type {Toast}
         */
        this.toaster = new Toast();
        /**
         * @type {Canvas}
         */
        this.canvas = new Canvas(this.mainElement, { maxZoom: 2.5 });
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
        this.playerSnake = opts.player;
        this.playerSnake.setCollisionMask(CollisionLayer.PLAYER_MASK);
        // Set up scrolling controls
        this.canvas.on("scroll", e => {
            this.canvas.zoomBy(1.001 ** (-e.detail.y), this.canvas.lastxy);
            this.message("hello");
        });
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
     * utility function
     * @returns {Promise<void>}
     */
    nextFrame() {
        return new Promise(r => requestAnimationFrame(r));
    }
    /**
     * @param {string|false} name
     */
    showPopover(name) {
        for (var popName in this.popovers) {
            var pop = this.popovers[popName];
            if (popName == name) pop.show();
            else pop.close();
        }
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get popoverActive() {
        return this.levelInfoPopover.open || Object.keys(this.popovers).some(name => this.popovers[name].open);
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
        Matter.World.remove(this.currentLevel.physicsWorld, this.playerSnake.body);
        this.currentLevelIndex = index;
        Matter.World.add(this.currentLevel.physicsWorld, this.playerSnake.body);
        var cl = this.currentLevel;
        var name = this.currentLevelIndex + (cl.title ? ": " + cl.title : "");
        this.levelInfoPopover.setContent(`<h1>Level ${name}</h1><div>${cl.objective}</div>`);
        this.levelInfoPopover.show();
    }
    /////////////////////////////////////////////////////////
    /**
     * start the main loop
     */
    async mainLoop() {
        while (true) {
            var wait = this.nextFrame();
            if (this.popoverActive) await this.waitFor("popoverclose");
            this.render();
            this.tickWorld();
            await wait;
        }
    }
    /**
     * Called after each step
     */
    tickWorld() {
        this.currentLevel.tickWorld();
        this.playerSnake.tickWorld();
        if (this.currentLevel.complete) this.showLevelCompleteToast();
    }
    /**
     * Render
     */
    render() {
        this.canvas.clear();
        this.canvas.drawTransformed(() => {
            this.canvas.ctx.globalAlpha = 1;
            this.currentLevel.renderTo(this.canvas.ctx);
            this.canvas.ctx.shadowColor = "white";
            this.canvas.ctx.shadowBlur = 3;
            this.playerSnake.renderTo(this.canvas.ctx);
        });
    }
}
