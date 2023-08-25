class Level {
    constructor(options) {
        /**
         * @type {Matter.Engine}
         */
        this.physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 }, enableSleeping: true });
        /**
         * @type {Matter.World}
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
            Matter.World.add(this.physicsWorld, snake.body);
        });
        /**
         * @type {Block[]}
         */
        this.blocks = options.blocks || [];
        this.blocks.forEach(block => {
            Matter.World.add(this.physicsWorld, block.body);
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
    tickWorld() {
        Matter.Engine.update(this.physicsEngine);
        this.snakes.forEach(snake => {
            this.snakes.forEach(snake2 => snake.listenTo(snake2));
            snake.tickWorld();
        });
        this.blocks.forEach(block => block.tickWorld());
        this.particles.forEach(particle => particle.tickWorld());
        // remove eaten particles after snakes eat them
        this.particles = this.particles.filter(particle => {
            if (particle.eaten) {
                Matter.World.remove(this.physicsWorld, particle.body);
                return false;
            }
            return true;
        });
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        this.snakes.forEach(snake => snake.renderTo(ctx));
        this.blocks.forEach(block => block.renderTo(ctx));
    }
    /**
     * @param {Snake} s
     */
    addSnake(s) {
        this.snakes.push(s);
        Matter.World.add(this.physicsWorld, snake.body);
    }
    /**
     * @param {Snake} s
     */
    removeSnake(s) {
        var i = this.snakes.indexOf(s);
        if (i == -1) return;
        Matter.World.remove(this.physicsWorld, snake.body);
        this.snakes.splice(i, 1);
    }
    /**
     * @param {Particle} p
     */
    addParticle(p) {
        this.particles.push(p);
        Matter.World.add(this.physicsWorld, p.body);
    }
    /**
     * @type {FoodParticle[]}
     */
    get foodParticles() {
        return this.particles.filter(particle => particle instanceof FoodParticle);
    }
}
