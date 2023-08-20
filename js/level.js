/**
 * @typedef {TBD} Goal
 */

class Level {
    constructor(options) {
        /**
         * @type {Matter.Engine}
         */
        this.physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
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
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        throw new Error("Not implemented");
    }
}