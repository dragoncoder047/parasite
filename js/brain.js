/**
 * @typedef Bin
 * @property {Snake[]} snakes
 * @property {Pheremone[]} pheremones
 * @property {Food[]} food_items
 * @property {Block[]} walls
 */

class Brain {
    /*

    [1] Self length
    [1] Self energy
    [2] Self velocity
    [x]* 5 eye sensors each have:
        [3] snake head hue + distance + energy
        [3] pheremone hue, distance + amount
        [2] food distance + amount
        [2] wall distance + presence
    [4] Touch on sides position + presence
    [2] Touch on tail, head
    [4] Sound L/R (center freq, vol)
    [x]* Integrating processes:
        [2] Tongue angle, position
        [1] Pheremone color
        [2] Head/tail hue
        [1] Sound frequency

    */
    static INPUT_DIMENSIONS = 84;
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
    }
    /**
     * @param {Snake} snake
     */
    setOwnerSnake(snake) {
        this.snake = snake;
    }
    /**
     * @abstract
     * @returns {number} The action in the {@link Action} enum.
     */
    think() {
        throw new Error("abstract method called");
    }
    /**
     * @abstract
     * rewards the AI
     */
    goodIdea() {
        throw new Error("abstract method called");
    }
    /**
     * @abstract
     * punishes the AI
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
        todo();
    }
}

class NNBrain extends Brain {
    constructor() {
        super();
        /**
         * @type {???}
         */
        this.actor = /* ??? */null;
    }
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
            Color.hsv(0.3, 1, 1),
        ];
    }
    get tongueLength() { return 0.5; }
    get tongueAngle() { return 0; }
}
