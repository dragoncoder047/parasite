/**
 * @param {Matter.Body} t
 * @param {Matter.Body[]} b
 * @returns {Matter.Body[]}
 */
function getHits(t, b) {
    return Matter.Query.collides(t, b).flatMap(coll => [coll.bodyA, coll.bodyB]);
}

/**
 * @typedef Bin
 * @property {Set<Snake>} snakes
 * @property {Set<FoodParticle>} food
 * @property {Set<Pheremone>} pheremones
 * @property {Set<Block>} walls
 */

/**
 * @typedef SoundSource
 * @property {number} angle
 * @property {number} freq
 * @property {number} volume
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
         * @type {SoundSource[]}
         */
        this.soundSources = [];
        /**
         * @type {number[]}
         */
        this.leftTouches = [];
        /**
         * @type {number[]}
         */
        this.rightTouches = [];
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
     * rewards the AI
     * @abstract
     * @param {number} reward
     */
    learn(reward) {
        throw new Error("abstract method called");
    }
    /**
     * @param {Level} level
     */
    scan(level) {
        for (var i = 0; i < 5; i++) this.scanBin(i, level);
    }
    /**
     * @param {0 | 1 | 2 | 3 | 4} binNumber
     * @param {Level} level
     */
    scanBin(binNumber, level) {
        var binCenterAngle = Math.PI / 4 * (binNumber - 2);
        var forward = new Vector(0, this.snake.depthOfVision).rotate(binCenterAngle);
        var triangle = Matter.Bodies.fromVertices(this.snake.head.position.x, this.snake.head.position.y, [[
            new Vector(0, 0),
            forward.rotate(-Math.PI / 8),
            forward,
            forward.rotate(Math.PI / 8),
        ]], {
            collisionFilter: this.snake.collisionFilter,
        });
        /**
         * @type {Bin}
         */
        var bin = {};
        // get snakes
        bin.snakes = new Set(getHits(triangle, level.snakes.flatMap(s => s.segments)).map(b => b.plugin.snake));
        // get pheremones
        bin.pheremones = new Set(getHits(triangle, level.activePheremones.map(s => s.body)).map(b => b.plugin.particle));
        // get food
        bin.food = new Set(getHits(triangle, level.foodParticles.map(s => s.body)).map(b => b.plugin.particle));
        // get blocks
        bin.walls = new Set(getHits(triangle, level.blocks.map(s => s.body)).map(b => b.plugin.block));
        this.bins[binNumber] = bin;
    }
    /**
     * @param {SoundSource} srcDetails
     */
    pushSoundSource(srcDetails) {
        this.soundSources.push(srcDetails);
    }

    /**
     * @param {number} position
     * @param {boolean} isLeft
     */
    pushTouch(position, isLeft) {
        if (position < 0) throw new Error("strange position");
        (isLeft ? this.leftTouches : this.rightTouches).push(position);
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
        todo();
    }
    learn(reward) {
        todo();
    }
}

class TestBrain extends NNBrain {
    constructor() {
        super();
    }
    think() {
        return Math.sin(Date.now() / 1000) * Math.sin(Date.now() / 100) < 0 ? Action.FORWARD : Action.NOTHING;
    }
    learn(reward) {
        // noop;
    }
}
