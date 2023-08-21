/**
 * @typedef {TBD} Goal
 */

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
            Matter.World.add(this.physicsWorld, snake.segments);
        });
        /**
         * @type {TBD[]}
         */
        this.blocks = options.blocks || [];
        this.blocks.forEach(block => {
            Matter.World.add(this.physicsWorld, block.body);
        });
        /**
         * @type {string}
         */
        this.title = options.title || "";
        /**
         * @type {string}
         */
        this.objective = options.objective || "";
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get complete() {
        if (this.goal) return this.goal.complete;
        return false;
    }
    tickWorld() {
        Matter.Engine.update(this.physicsEngine);
        this.snakes.forEach(snake => snake.tickWorld());
        this.blocks.forEach(block => block.tickWorld());
        this.snakes.forEach(snake => {
            snake.head.force = new Vector(0, 0.01).rotate(snake.head.angle).plus(snake.head.force);
            snake.head.torque += 0.001;
        });
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        this.snakes.forEach(snake => snake.renderTo(ctx));
        this.blocks.forEach(block => block.renderTo(ctx));
    }
}