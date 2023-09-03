class ParasiteGame extends XEventEmitter {
    /**
     * @type {ParasiteGame}
     */
    static _instance = null;
    /**
     * @returns {ParasiteGame}
     */
    static instance() {
        return ParasiteGame._instance;
    }
    constructor(opts) {
        super();
        if (ParasiteGame._instance !== null) throw new TypeError("can only have one game");
        ParasiteGame._instance = this;
        /**
         * @type {Object<string, Dialog>}
         */
        this.dialogs = Object.assign({}, opts.dialogs);
        /**
         * @type {Level[]}
         */
        this.levels = opts.levels;
        // Patch in the prev, next, and index
        for (var i = 0; i < this.levels.length; i++) this.levels[i].setInfo(this.levels[i - 1], i);
        /**
         * @type {Dialog}
         */
        this.levelInfoDialog = new Dialog(null, "Play");
        this.dialogs._levelInfo = this.levelInfoDialog;
        /**
         * @type {Dialog}
         */
        this.levelsDialog = new Dialog(null, false);
        this.dialogs._levels = this.levelsDialog;
        this.dialogs._levels.inside.innerHTML = "";
        var h1 = document.createElement("h1");
        h1.textContent = "Levels";
        this.dialogs._levels.inside.append(h1, ...this.levels.map((l, i) => {
            var a = document.createElement("a");
            a.href = "#level" + i;
            a.append(l.levelListEntry);
            a.addEventListener("click", e => {
                e.preventDefault();
                if (l.unlocked) {
                    this.showDialog(false);
                    this.openLevel(i);
                }
                else this.showToast("Level is locked!", "warning");
            });
            return a;
        }));
        Object.keys(this.dialogs).forEach(name => this.dialogs[name].pipeTo("close", this, "dialogclose"));
        /**
         * @type {Toast}
         */
        this.toaster = new Toast();
        /**
         * @type {Canvas}
         */
        this.canvas = opts.canvas;
        /**
         * @type {number}
         */
        this.currentLevelIndex = 0;
        /**
         * @type {Snake}
         */
        this.playerSnake = opts.player;
        // Set up scrolling controls
        this.canvas.on("scroll", e => {
            this.canvas.zoomBy(1.001 ** (-e.detail.y), this.canvas.center || this.canvas.lastxy);
        });
        // Sidebar
        this._makeSidebar(opts.sidebar, opts.sidebarDialogNames);
    }
    //////////////////////////////////////////////////////
    /**
     * @param {string} message
     * @param {"info" | "warning" | "error" | "success" | false} [type=false] The dialog type
     */
    showToast(message, type) {
        this.toaster.show(message, type);
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
    showDialog(name) {
        for (var popName in this.dialogs) {
            var pop = this.dialogs[popName];
            if (popName === name) pop.show();
            else pop.close();
        }
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get dialogActive() {
        return !!document.querySelector("dialog:not(.toast)[open]");
    }
    /**
     * @type {Promise<void>}
     * @readonly
     */
    get allDialogsClosed() {
        // if (this.dialogActive)
        return (async () => { while (this.dialogActive) await this.nextFrame() })();
        // else return Promise.resolve();
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
        if (this.currentLevelIndex + 1 < this.levels.length) {
            var button = document.createElement("button");
            button.addEventListener("click", () => this.nextLevel());
            button.textContent = "Next level \u21d2";
            span.append("Level complete!\u2001", button);
        }
        else span.append("All levels complete!! (there are no more)");
        this.toaster.show(span, "success", true);
    }
    nextLevel() {
        this.toaster.close();
        this.openLevel(this.currentLevelIndex + 1);
    }
    /**
     * @param {number} index
     */
    openLevel(index) {
        // remove player snake from current level
        this.currentLevel.removeSnake(this.playerSnake);
        this.currentLevelIndex = index;
        this.currentLevel.addSnake(this.playerSnake);
        this.playerSnake.scrunch(this.currentLevel.entry.position, this.currentLevel.entry.angle);
        var cl = this.currentLevel;
        var name = (this.currentLevelIndex + 1) + (cl.title ? ": " + cl.title : "");
        this.levelInfoDialog.setContent(`<h1>Level ${name}</h1><div>${cl.objective}</div>`);
        this.showDialog("_levelInfo");
        this.canvas.zoom = 1;
        this.canvas.panxy = new Vector(this.playerSnake.head.position).plus(this.canvas.center);
    }
    /////////////////////////////////////////////////////////
    /**
     * start the main loop
     */
    async mainLoop() {
        while (true) {
            var wait = this.nextFrame();
            await this.allDialogsClosed;
            this.render();
            this.tickWorld();
            if (this.currentLevel.complete || true) this.showLevelCompleteToast(); // TODO: REMOVE THIS KLUDGE
            await wait;
        }
    }
    /**
     * Called after each step
     */
    tickWorld() {
        this.currentLevel.tickWorld();
        this.canvas.follow(this.playerSnake.head.position);
    }
    /**
     * Render
     */
    render() {
        this.canvas.clear();
        this.canvas.drawTransformed(() => this.currentLevel.renderTo(this.canvas.ctx));
    }
    //////////////////////////////////////////////////////////////////////
    // Sidebar
    /**
     * @param {HTMLElement} el
     * @param {string[]} names
     */
    _makeSidebar(el, names) {
        names.forEach(name => {
            var a = document.createElement("a");
            a.href = "#" + name; // dummy, does nothing
            a.addEventListener("click", e => {
                e.preventDefault();
                this.showDialog(name);
            });
            a.append(camel2words(name));
            var p = document.createElement("p");
            p.append(a);
            el.append(p);
        });
    }
}
