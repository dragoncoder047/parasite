/**
 * @typedef Bin
 * @property {Snake[]} snakes
 */

/**
 * @typedef Color
 * @property {number} r
 * @property {number} g
 * @property {number} b
 */

class Brain {
    /**
     * @param {Snake} snake
     */
    constructor(snake) {
        /**
         * @type {Snake}
         */
        this.snake = snake;
        // The input state
        /**
         * @type {Bin[]}
         */
        this.bins = [{}, {}, {}, {}, {}];
        // The output state
        /**
         * @type {Vector}
         */
        this.thrust = new Vector(0, 0);
        /**
         * @type {Color[]}
         */
        this.mood = [{ r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }];
        /**
         * @type {number}
         */
        this.tongueAngle = 0;
        /**
         * @type {number}
         */
        this.tongueLength = 10;
    }
    /**
     * @abstract
     */
    think() {
        throw new Error("abstract method called");
    }
    scanWorld(world) {
        for (var i = 0; i < 5; i++) this.scanBin(i, world);
    }
    scanBin(bin, world) {
        var binCenterAngle = Math.PI / 4 * (bin - 2);
        var forward = new Vector(0, this.snake.depthOfVision).rotate(binCenterAngle);
        var triangle = Matter.Bodies.fromVertices(this.snake.head.position.x, this.snake.head.position.y, [[
            new Vector(0, 0),
            forward.rotate(-Math.PI / 8),
            forward,
            forward.rotate(Math.PI / 8),
        ]]);
        var hits = Matter.Query.collides(triangle, Matter.World.allBodies(world)).flatMap(coll => [coll.bodyA, coll.bodyB]);
    }
}
