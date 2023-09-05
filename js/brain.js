/**
 * @param {Matter.Body} t
 * @param {Matter.Body[]} b
 * @returns {BinHit[]}
 */
function getHits(t, b) {
    return Matter.Query.collides(t, b)
        .map(coll => ({
            body: t === coll.bodyA ? coll.bodyB : coll.bodyA,
            point: Vector.apply((...n) => n.reduce((a, b) => a + b), ...coll.supports)
                .scale(1 / coll.supports.length)
        }));
}

/**
 * @param {Vector} pt
 * @param {BinHit[]} hits
 * @returns {BinHit?}
 */
function closest(pt, hits) {
    var sorted = hits.sort((a, b) => new Vector(b.point).minus(pt).length() - new Vector(a.point).minus(pt).length());
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
     * @returns {number[]} List of the actions in the {@link Action} enum.
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
        bin.wall = closest(this.snake.head.position, getHits(triangle, level.blocks.map(s => s.body)));
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
    /**
     * @returns {{lf: number, lv: number, rf: number, rv: number}}
     */
    aggregateSound() {
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
        return { lf, lv, rf, rv };
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
        this.agent = new RL.DQNAgent({
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
        var ia = new Array(NNBrain.INPUT_DIMENSIONS).fill(0);
        ia[0] = this.snake.length;
        ia[1] = this.snake.energy;
        ia[2] = this.snake.head.velocity.x;
        ia[3] = this.snake.head.velocity.y;
        for (var bn = 0; bn < 5; bn++) {
            var bbi = bn * 10;
            if (this.bins[bn].snake) {
                ia[bbi + 4] = this.bins[bn].snake.body.plugin.snake.headHue;
                ia[bbi + 5] = this.bins[bn].snake.point.minus(this.snake.head.position).length();
                ia[bbi + 6] = this.bins[bn].snake.body.plugin.snake.energy;
            }
            if (this.bins[bn].pheremone) {
                ia[bbi + 7] = this.bins[bn].pheremone.body.plugin.particle.hue;
                ia[bbi + 8] = this.bins[bn].pheremone.point.minus(this.snake.head.position).length();
                ia[bbi + 9] = this.bins[bn].pheremone.body.plugin.particle.size;
            }
            if (this.bins[bn].food) {
                ia[bbi + 10] = this.bins[bn].food.point.minus(this.snake.head.position).length();
                ia[bbi + 11] = this.bins[bn].food.body.plugin.particle.size;
            }
            if (this.bins[bn].snake) {
                ia[bbi + 12] = this.bins[bn].snake.point.minus(this.snake.head.position).length();
                ia[bbi + 13] = 1;
            }
        }
        ia[54] = this.leftTouches.length ? 1 : 0;
        ia[55] = ia[54] ? this.leftTouches.reduce((a, b) => a + b) / this.leftTouches.length : 0;
        ia[56] = this.rightTouches.length ? 1 : 0;
        ia[57] = ia[56] ? this.rightTouches.reduce((a, b) => a + b) / this.rightTouches.length : 0;
        ia[58] = this.headSnake ? 1 : 0;
        ia[59] = this.tailSnake ? 1 : 0;
        // sound
        var { lf, lv, rf, rv } = this.aggregateSound();
        ia[60] = lf;
        ia[61] = lv;
        ia[62] = rf;
        ia[63] = rv;
        // proprioception
        ia[64] = this.snake.tongueAngle;
        ia[65] = this.snake.tongueLength;
        ia[66] = this.snake.pheremoneHue;
        ia[67] = this.snake.headHue;
        ia[68] = this.snake.tailHue;
        ia[69] = this.snake.soundFreq;
        return [this.agent.act(ia)];
    }
    learn(reward) {
        if (reward != 0) this.agent.learn(reward);
    }
}

class PlayerBrain extends Brain {
    /**
     * @param {IOStack} stack
     * @param {Control} control
     * @param {HTMLDivElement} bottombar
     */
    constructor(stack, control, bottombar) {
        super();
        /**
         * @type {InputCtx}
         */
        this.ctx = new InputCtx(stack, control);
        this.ctx.takeControl();
        /**
         * @type {HTMLDivElement}
         */
        this.bar = bottombar;
        // make 3 column
        /**
         * @type {HTMLDivElement}
         */
        this.column1 = document.createElement("div");
        this.column1.style.flex = 1;
        /**
         * @type {HTMLDivElement}
         */
        this.column2 = document.createElement("div");
        this.column2.style.flex = 2;
        this.column2.classList.add("flex-column");
        /**
         * @type {HTMLDivElement}
         */
        this.column3 = document.createElement("div");
        this.column3.style.flex = 1;
        this.bar.append(this.column1, this.column2, this.column3);
        // make energy meter and output
        /**
         * @type {HTMLOutputElement}
         */
        this.energyoutput = document.createElement("output");
        /**
         * @type {HTMLMeterElement}
         */
        this.energybar = document.createElement("meter");
        this.energybar.style.flex = 1;
        this.energybar.min = 0;
        this.energybar.max = 1000;
        this.energybar.low = 100;
        this.energybar.high = 500;
        this.energybar.optimum = 900;
        var span = document.createElement("span");
        span.append("Energy: ", this.energyoutput);
        var r1 = document.createElement("div");
        r1.style.flex = 1;
        r1.classList.add("flex-row");
        r1.append(span, this.energybar);
        this.column2.append(r1);
        /**
         * @type {HTMLOutputElement}
         */
        this.headSwatch = document.createElement("output");
        /**
         * @type {HTMLOutputElement}
         */
        this.tailSwatch = document.createElement("output");
        /**
         * @type {HTMLOutputElement}
         */
        this.pherSwatch = document.createElement("output");
        [this.headSwatch, this.tailSwatch, this.pherSwatch].forEach(s => s.classList.add("swatch"));
        var hh = document.createElement("span");
        hh.append("Head Hue: ", this.headSwatch, "Tail Hue: ", this.tailSwatch, "Pheremone Hue: ", this.pherSwatch);
        /**
         * @type {HTMLOutputElement}
         */
        this.sndL = document.createElement("output");
        /**
         * @type {HTMLOutputElement}
         */
        this.sndR = document.createElement("output");
        var r2 = document.createElement("div");
        r2.append(hh, "Sound: ", this.sndL, " (left) ", this.sndR, " (right)");
        r2.style.flex = 1;
        this.column2.append(r2);
    }
    think() {
        this.showPlayerStatus();
        // todo create sensible output
        // this.listener.sendOutput(output);
        var actions = this.ctx.getInputs() || [Action.NOTHING];
        return actions;
    }
    learn() {
        // player plays. They learn from their own experience.
    }
    showPlayerStatus() {
        // only thing implemented right now is energy
        this.energyoutput.value = this.snake.energy.toFixed();
        this.energybar.value = this.snake.energy;
        this.headSwatch.textContent = (this.snake.headHue * 360) | 0;
        this.tailSwatch.textContent = (this.snake.tailHue * 360) | 0;
        this.pherSwatch.textContent = (this.snake.pheremoneHue * 360) | 0;
        this.headSwatch.style.backgroundColor = Color.hsv(this.snake.headHue, 1, 1).toCSSStr();
        this.tailSwatch.style.backgroundColor = Color.hsv(this.snake.tailHue, 1, 1).toCSSStr();
        this.pherSwatch.style.backgroundColor = Color.hsv(this.snake.pheremoneHue, 1, 1).toCSSStr();
        var { lf, lv, rf, rv } = this.aggregateSound();
        this.sndL.textContent = lv.toFixed(2) + (lv > 0 ? " " + lf.toFixed(1) : "");
        this.sndR.textContent = rv.toFixed(2) + (rv > 0 ? " " + rf.toFixed(1) : "");
    }
}
