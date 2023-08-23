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

class Brain {
    static INPUT_DIMENSIONS = 84;
    static OUTPUT_DIMENSIONS = 20;
    constructor() {
        /**
         * @type {Snake}
         */
        this.snake = null;
        // The input state
        /**
         * @type {Bin[]}
         */
        this.bins = [{}, {}, {}, {}, {}];
        /**
         * @type {number[]}
         */
        this.inputVector = [];
        /**
         * @type {number[]}
         */
        this.outputVector = [];
    }
    /**
     * @param {Snake} snake
     */
    setOwnerSnake(snake) {
        this.snake = snake;
    }
    /**
     * @abstract
     */
    think() {
        throw new Error("abstract method called");
    }
    /**
     * @abstract
     */
    goodIdea() {
        throw new Error("abstract method called");
    }
    /**
     * @abstract
     */
    badIdea() {
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
            collisionFilter: this.snake.collisionFilter,
        });
        var hits = Matter.Query.collides(triangle, Matter.World.allBodies(world)).flatMap(coll => [coll.bodyA, coll.bodyB]);
        throw new Error("Todo scanBin()");
    }
    /**
     * @type {{thrust: number, torque: number}}
     * @readonly
     */
    get motion() {
        return { thrust: this.outputVector[0], torque: this.outputVector[1] };
    }
    /**
     * @type {[Color, Color]}
     * @readonly
     */
    get mood() {
        return [
            Color.hsv(this.outputVector[2], this.outputVector[3], this.outputVector[4]),
            Color.hsv(this.outputVector[5], this.outputVector[6], this.outputVector[7]),
        ];
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueAngle() {
        return map(this.outputVector[8], -1, 1, -Math.PI / 2, Math.PI / 2);
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueLength() {
        return map(this.outputVector[9], 0, 1, 0, this.snake.depthOfVision);
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get hungry() {
        return this.outputVector[10];
    }
    /**
     * @type {[boolean, boolean]}
     * @readonly
     */
    get inHeat() {
        return [this.outputVector[11], this.outputVector[12]];
    }
    /**
     * @type {boolean}
     * @readonly
     */
    get wantsToGrow() {
        return this.outputVector[13];
    }
    /**
     * @type {{color: Color, release: boolean}}
     * @readonly
     */
    get pheremones() {
        return { color: Color.hsv(this.outputVector[14], this.outputVector[15], this.outputVector[16]), release: this.outputVector[17] };
    }
    /**
     * @type {{freq: number, vol: number}}
     * @readonly
     */
    get sound() {
        return { freq: this.outputVector[18], vol: this.outputVector[19] };
    }
}

class NNBrain extends Brain {
    static GRANULES = 0.1;
    static OUTPUT_CHOICES = (function () {
        const c01 = irange(0, 1, NNBrain.GRANULES);
        const c_11 = irange(-1, 1, NNBrain.GRANULES);
        const bool = [true, false];
        return [
            c01, // thrust
            c_11, // steering
            c01, c01, c01, // mood 1
            c01, c01, c01, // mood 2
            c_11, // tongue angle
            c01, // tongue length
            bool, // hungry
            bool, bool, // mate
            bool, // grow
            c01, c01, c01, bool, // pheremones
            c01, c01, // sound
        ];
    })();
    constructor() {
        super();
        /**
         * @type {???}
         */
        this.actor = /* ??? */null;
    }
    /**
     * Uses the input vector to update the output vector.
     */
    think() {
        throw new Error("TODO");
    }
    goodIdea() {
        //this.actor.learn(1); // Reward
    }
    badIdea() {
        //this.actor.learn(-1); // Punish
    }
}

class TestBrain extends NNBrain {
    constructor() {
        super();
    }
    get mood() {
        return [
            Color.hsv(0.7, 1, 1),
            Color.hsv((Date.now() / 10000) % 1, 1, 1),
        ];
    }
    get tongueLength() { return 1; }
    get tongueAngle() { return Math.sin(Date.now() / 400) / 5; }
}

// sanity check myself
if (Brain.OUTPUT_DIMENSIONS != NNBrain.OUTPUT_CHOICES.length) throw new Error("i screwed up");
