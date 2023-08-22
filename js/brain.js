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
            collisionFilter: {/* TODO */ },
        });
        var hits = Matter.Query.collides(triangle, Matter.World.allBodies(world)).flatMap(coll => [coll.bodyA, coll.bodyB]);
        throw new Error("Todo scanBin()");
    }
    /**
     * @return {never}
     */
    notImplemented() {
        throw new Error("Not Implemented");
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
            hsv2rgb(this.outputVector[2], this.outputVector[3], this.outputVector[4]),
            hsv2rgb(this.outputVector[5], this.outputVector[6], this.outputVector[7]),
        ];
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueAngle() {
        return lerpClamp(this.outputVector[8], 0, Math.PI / 2);
    }
    /**
     * @type {number}
     * @readonly
     */
    get tongueLength() {
        return lerpClamp(this.outputVector[9], 0, this.snake.depthOfVision);
    }
    /**
     * @type {number}
     * @readonly
     */
    get hunger() {
        return this.outputVector[10];
    }
    /**
     * @type {[number, number]}
     * @readonly
     */
    get mateInstinct() {
        return [this.outputVector[11], this.outputVector[12]];
    }
    /**
     * @type {number}
     * @readonly
     */
    get growth() {
        return this.outputVector[13];
    }
    /**
     * @type {{color: Color, amount: number}}
     * @readonly
     */
    get pheremones() {
        return { color: hsv2rgb(this.outputVector[14], this.outputVector[15], this.outputVector[16]), amount: this.outputVector[17] };
    }
    /**
     * @type {{freq: number, vol: number}}
     * @readonly
     */
    get sound() {
        return { freq: this.outputVector[18], vol: this.outputVector[19] };
    }
}

class NeuralNetBrain extends Brain {
    constructor() {
        super();
        /**
         * @type {RL.DQNAgent}
         */
        this.actor = new RL.DQNAgent({
            getNumStates: () => 84,
            getMaxNumActions: () => 20,
        }, { experience_add_every: 1 });
    }
    /*
        act: function(slist) {
            // convert to a Mat column vector
            var s = new R.Mat(this.ns, 1);
            s.setFrom(slist);

            // epsilon greedy policy
            if(Math.random() < this.epsilon) {
                var a = randi(0, this.na);
            } else {
                // greedy wrt Q function
                var amat = this.forwardQ(this.net, s, false);
                var a = R.maxi(amat.w); // returns index of argmax action
            }

            // shift state memory
            this.s0 = this.s1;
            this.a0 = this.a1;
            this.s1 = s;
            this.a1 = a;

            return a;
        },
    */
    /**
     * Uses the input vector to update the output vector.
     */
    think() {
        var s = new R.Mat(this.actor.ns, 1);
        s.setFrom(this.inputVector);
        var amat = this.actor.forwardQ(this.actor.net, s, false);
        if (amat.w.length != 20) throw new Error("bad NN");
        this.outputVector = amat.w;
        this.actor.s0 = this.actor.s1;
        this.actor.a0 = this.actor.a1;
        this.actor.s1 = s;
        this.actor.a1 = R.maxi(amat.w); // satisfy algorithm
    }
    goodIdea() {
        this.actor.learn(1); // Reward
    }
    badIdea() {
        this.actor.learn(-1); // Punish
    }
}