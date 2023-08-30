class Level {
    constructor(options) {
        /**
         * @type {Matter.Engine}
         */
        this.physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 }, enableSleeping: true });
        Matter.Events.on(this.physicsEngine,
            "collisionStart collisionActive",
            e => e.pairs.forEach(pair => this.processCollision(pair)));
        /**
         * @type {Matter.Composite}
         */
        this.physicsWorld = this.physicsEngine.world;
        /**
         * @type {Goal}
         */
        this.goal = options.goal;
        /**
         * @type {Snake[]}
         */
        this.snakes = options.snakes || [];
        this.snakes.forEach(snake => {
            Matter.Composite.add(this.physicsWorld, snake.body);
        });
        /**
         * @type {Block[]}
         */
        this.blocks = options.blocks || [];
        this.blocks.forEach(block => {
            Matter.Composite.add(this.physicsWorld, block.body);
        });
        /**
         * @type {Particle[]}
         */
        this.particles = [];
        /**
         * @type {string}
         */
        this.title = options.title || "";
        /**
         * @type {string}
         */
        this.objective = options.objective || "";
        /**
         * @type {{position: Vector, angle: number}}
         */
        this.entry = options.entry || { position: new Vector(0, 0), angle: 0 };
        // Make level info element
        /**
         * @type {HTMLLIElement}
         */
        this.levelListEntry = document.createElement("p");
        /**
         * @type {HTMLSpanElement}
         */
        this.beatenIndicator = document.createElement("span");
        /**
         * @type {Level?}
         */
        this.prevLevel = null;
        /**
         * @type {number}
         */
        this.index = null;
    }
    /**
     * @param {Level?} prev
     * @param {number} i
     */
    setInfo(prev, i) {
        this.prevLevel = prev;
        this.index = i;
        this.levelListEntry.innerHTML = "";
        this.levelListEntry.append("Level " + i + ": " + this.title, this.beatenIndicator);
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get complete() {
        if (this.goal) {
            this.goal.evaluate(this);
            return this.goal.complete;
        }
        return false;
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get unlocked() {
        return this.complete || (!this.prevLevel || this.prevLevel.complete);
    }
    tickWorld() {
        Matter.Engine.update(this.physicsEngine);
        this.snakes.forEach(snake => {
            this.snakes.forEach(snake2 => snake.listenTo(snake2));
            snake.tickWorld(this);
        });
        this.blocks.forEach(block => block.tickWorld());
        this.particles.forEach(particle => particle.tickWorld());
        // remove eaten particles after snakes eat them
        this.particles = this.particles.filter(particle => {
            if (particle.eaten) {
                Matter.Composite.remove(this.physicsWorld, particle.body);
                return false;
            }
            return true;
        });
        // randomly add food
        if (Math.random() < 0.01) {
            this.addParticle(new FoodParticle(
                gauss(20, 20),
                new Vector(gauss(0, 1000), gauss(0, 1000)),
                new Vector(gauss(0, 5), gauss(0, 5))));
        }
        // update level complete indicator
        if (this.complete) {
            this.beatenIndicator.style.color = "lime";
            this.beatenIndicator.textContent = "\u2713 Beaten!";
        } else if (!this.prevLevel || this.prevLevel.complete) {
            this.beatenIndicator.textContent = "";
        } else {
            this.beatenIndicator.style.color = "gray";
            this.beatenIndicator.textContent = "\u{1f512} Locked";
        }
    }
    /**
     * @param {Matter.Pair} pair
     */
    processCollision(pair) {
        var snake = pair.bodyA.plugin.snake || pair.bodyB.plugin.snake;
        var isA = pair.bodyA.plugin.snake === snake;
        var sBody = isA ? pair.bodyA : pair.bodyB;
        var oBody = isA ? pair.bodyB : pair.bodyA;
        if (!snake) return;
        var other = isA ? pair.bodyB.plugin : pair.bodyA.plugin;
        var n = new Vector(pair.collision.normal);
        if (other.particle) {
            if (other.particle instanceof RewardSignal) snake.addReward(other.particle);
        }
        else if (other.snake) {
            // we got two snakes
            snake.touchedObject(other.snake, n, sBody);
            other.snake.touchedObject(snake, n.scale(-1), oBody);
        }
        else if (other.block) {
            // hit the wall
            snake.touchedObject(null, n, sBody);
        }
        // all other collisions (particle-wall, particle-particle, glass-wall) are ignored
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        this.particles.forEach(particle => particle.renderTo(ctx));
        this.snakes.forEach(snake => snake.renderTo(ctx));
        this.blocks.forEach(block => block.renderTo(ctx));
    }
    /**
     * @param {Snake} s
     */
    addSnake(s) {
        this.snakes.push(s);
        Matter.Composite.add(this.physicsWorld, s.body);
    }
    /**
     * @param {Snake} s
     */
    removeSnake(s) {
        var i = this.snakes.indexOf(s);
        if (i == -1) return;
        Matter.Composite.remove(this.physicsWorld, s.body);
        this.snakes.splice(i, 1);
    }
    /**
     * @param {Particle} p
     */
    addParticle(p) {
        this.particles.push(p);
        Matter.Composite.add(this.physicsWorld, p.body);
    }
    /**
     * @type {FoodParticle[]}
     * @readonly
     */
    get foodParticles() {
        return this.particles.filter(particle => particle instanceof FoodParticle);
    }
    /**
     * @type {Pheremone[]}
     * @readonly
     */
    get activePheremones() {
        return this.particles.filter(particle => particle instanceof Pheremone);
    }
}
