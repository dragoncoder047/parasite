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
        this.playerSnake = opts.player;
        this.playerSnake.setCollisionMask(CollisionLayer.PLAYER_MASK);
        // Set up scrolling controls
        this.canvas.on("scroll", e => {
            this.canvas.zoomBy(1.001 ** (-e.detail.y), this.canvas.lastxy);
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
        Matter.World.remove(this.currentLevel.physicsWorld, this.playerSnake.body);
        this.currentLevelIndex = index;
        Matter.World.add(this.currentLevel.physicsWorld, this.playerSnake.body);
        var cl = this.currentLevel;
        this.popovers.levelInfo.innerHTML = `
        <h1>Level ${this.currentLevelIndex}${": ".repeat(!!cl.title)}${cl.title}</h1>
        <div>${cl.objective}</div>
        <form method="dialog">
        <input type="submit" value="Play" />
        </form>
        `;
        this.showPopover("levelInfo");
    }
    /////////////////////////////////////////////////////////
    /**
     * start the main loop
     */
    async mainLoop() {
        while (true) {
            var wait = this.nextFrame();
            if (this.popoverActive) await this.waitFor("popoverclosed");
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
