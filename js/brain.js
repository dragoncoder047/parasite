/**
 * @param {Matter.Body} t
 * @param {Matter.Body[]} b
 * @returns {BinHit[]}
 */
function getHits(t, b) {
    return Matter.Query.collides(t, b)
        .map(pair => ({
            body: t === pair.bodyA ? pair.bodyB : pair.bodyA,
            point: Vector.apply((...n) => n.reduce((a, b) => a + b), ...pair.activeContacts)
                .scale(1 / pair.activeContacts.length)
        }));
}

/**
 * @param {Vector} pt
 * @param {BinHit[]} hits
 * @returns {BinHit?}
 */
function closest(pt, hits) {
    var sorted = hits.sort((a, b) => new Vector(a.point).minus(pt).length() - new Vector(b.point).minus(pt).length());
    alert(sorted.map(x => new Vector(x.point).minus(pt).length()));
    return sorted[0] || null;
}

/**
 * @typedef BinHit
 * @property {Vector} point
 * @property {Matter.Body} body
 */

/**
 * @typedef Bin
 * @property {BinHit?} snake
 * @property {BinHit?} food
 * @property {BinHit?} pheremone
 * @property {BinHit?} wall
 */

/**
 * @typedef SoundSource
 * @property {number} angle
 * @property {number} freq
 * @property {number} volume
 */

class Brain {
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
        bin.snake = closest(this.snake.head.position, getHits(triangle, level.snakes.flatMap(s => s.segments)));
        bin.pheremone = closest(this.snake.head.position, getHits(triangle, level.activePheremones.map(s => s.body)));
        bin.food = closest(this.snake.head.position, getHits(triangle, level.foodParticles.map(s => s.body)));
        bin.wall = closest(this.snake.head.position, getHits(triangle, level.blocks.flatMap(s => s.body)));
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
    static INPUT_DIMENSIONS = 70;
    constructor() {
        super();
        /**
         * @type {RL.DQNAgent}
         */
        this.actor = new RL.DQNAgent({
            getNumStates: () => NNBrain.INPUT_DIMENSIONS,
            getMaxNumActions: () => Action.NUM_AI_ACTIONS,
        }, {
            experience_add_every: 1,
        });
    }
    /**
     * @returns {number}
     */
    think() {
        // assemble input vector
        var i = new Array(NNBrain.INPUT_DIMENSIONS).fill(0);
        i[0] = this.snake.length;
        i[1] = this.snake.energy;
        i[2] = this.snake.head.velocity.x;
        i[3] = this.snake.head.velocity.y;
        for (var i = 0; i < 5; i++) {
            var b = i * 10;
            if (this.bins[i].snake) {
                i[b + 0] = this.bins[i].snake.body.plugin.snake.headHue;
                i[b + 1] = this.bins[i].snake.point.minus(this.snake.head.position).length();
                i[b + 2] = this.bins[i].snake.body.plugin.snake.energy;
            }
            if (this.bins[i].pheremone) {
                i[b + 3] = this.bins[i].pheremone.body.plugin.particle.hue;
                i[b + 4] = this.bins[i].pheremone.point.minus(this.snake.head.position).length();
                i[b + 5] = this.bins[i].pheremone.body.plugin.particle.size;
            }
            if (this.bins[i].food) {
                i[b + 6] = this.bins[i].food.point.minus(this.snake.head.position).length();
                i[b + 7] = this.bins[i].food.body.plugin.particle.size;
            }
            if (this.bins[i].snake) {
                i[b + 8] = this.bins[i].snake.point.minus(this.snake.head.position).length();
                i[b + 9] = 1;
            }
        }
        i[54] = this.leftTouches.length ? 1 : 0;
        i[55] = this.leftTouches.reduce((a, b) => a + b) / this.leftTouches.length;
        i[56] = this.rightTouches.length ? 1 : 0;
        i[57] = this.rightTouches.reduce((a, b) => a + b) / this.rightTouches.length;
        i[58] = this.headSnake ? 1 : 0;
        i[59] = this.tailSnake ? 1 : 0;
        // sound
        var lv = 0, lsf = 0, rv = 0, rsf = 0;
        for (var ss of this.soundSources) {
            var pan = Math.sin(ss.angle);
            var lf = ss.volume * clamp(1 - pan, 0, 1);
            var rf = ss.volume * clamp(1 + pan, 0, 1);
            lv += lf;
            rv += rf;
            lsf += ss.freq * lf;
            rsf += ss.freq * rf;
        }
        var lf = lsf / lv, rf = rsf / rv;
        i[60] = lf;
        i[61] = lv;
        i[62] = rf;
        i[63] = rv;
        // proprioception
        i[64] = this.snake.tongueAngle;
        i[65] = this.snake.tongueLength;
        i[66] = this.snake.pheremoneHue;
        i[67] = this.snake.headHue;
        i[68] = this.snake.tailHue;
        i[69] = this.snake.soundFreq;
        return this.agent.act(i);
    }
    learn(reward) {
        if (reward != 0) this.agent.learn(reward);
    }
}

class PlayerBrain extends Brain {
    /**
     * @param {InputDispatcher} dispatcher
     * @param  {InputTransformer[]} transformers
     */
    constructor(dispatcher, transformers) {
        /**
         * @type {InputListener}
         */
        this.listener = new InputListener(...transformers);
        dispatcher.pushContext(this.listener);
    }
    think() {
        // todo create sensible output
        // this.listener.sendOutput(output);
        return this.listener.getNext() || Action.NOTHING;
    }
}
