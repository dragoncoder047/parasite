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
    }
    tickWorld() {
        Matter.Engine.update(this.physicsEngine);
        this.snakes.forEach(snake => snake.tickWorld());
        this.blocks.forEach(block => block.tickWorld());
        this.snakes.forEach(snake => {
            snake.head.force = new Vector(0.0005, 0.001).rotate(snake.head.angle).plus(snake.head.force);
        })
    }
}