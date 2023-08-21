/*

Input vector: total 84
[1] Self length
[1] Self energy
[2] Self velocity
[70]* 5 eye sensors each have:
    [5] snake head color + distance + energy
    [5] pheremone color distance + amount
    [2] food distance + amount
    [2] wall distance + presence
[4] Touch on sides position + presence
[2] Touch on tail, head
[4] Sound L/R (center freq, vol)

Output vector: total 20
[1] Thrust
[1] Torque
[2] Tongue angle/position
[1] Eat
[2] Mate instinct (head/tail)
[1] Growth
[4] Pheremone color + amount
[3] Head color
[3] Tail color
[2] Sound (freq, vol)


*/

/**
 * @typedef Bin
 * @property {Snake[]} snakes
 * @property {Pheremone[]} pheremones
 * @property {Food[]} food_items
 * @property {Block[]} walls
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
    }
    /**
     * @abstract
     */
    think() {
        throw new Error("abstract method called");
    }
    /**
     * @param {Matter.World} world
     */
    scanWorld(world) {
        for (var i = 0; i < 5; i++) this.scanBin(i, world);
    }
    /**
     * @param {0 | 1 | 2 | 3 | 4} bin
     * @param {Matter.World} world
     */
    scanBin(bin, world) {
        var binCenterAngle = Math.PI / 4 * (bin - 2);
        var forward = new Vector(0, this.snake.depthOfVision).rotate(binCenterAngle);
        var triangle = Matter.Bodies.fromVertices(this.snake.head.position.x, this.snake.head.position.y, [[
            new Vector(0, 0),
            forward.rotate(-Math.PI / 8),
            forward,
            forward.rotate(Math.PI / 8),
        ]], {
            collisionFilter: {/* TODO */},
        });
        var hits = Matter.Query.collides(triangle, Matter.World.allBodies(world)).flatMap(coll => [coll.bodyA, coll.bodyB]);
        throw new Error("Todo scanBin()");
    }
    notImplemented() {
        throw new Error("Not Implemented");
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get thrust() {
        this.notImplemented();
    }
    /**
     * @type {[Color, Color]}
     * @readonly
     */
    get mood() {
        this.notImplemented();
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueAngle() {
        this.notImplemented();
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueLength() {
        this.notImplemented();
    }
}
