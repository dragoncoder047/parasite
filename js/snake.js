/**
 * @enum
 */
class Action {
    static NOTHING = 0;
    static FORWARD = 1;
    static LEFT = 2;
    static RIGHT = 3;
    static TONGUE_OUT = 4;
    static TONGUE_IN = 5;
    static TONGUE_LEFT = 6;
    static TONGUE_RIGHT = 7;
    static EAT = 8;
    static MATE_H = 9;
    static MATE_T = 10;
    static GROW = 11;
    static PHEREMONE_INC_COLOR = 12;
    static PHEREMONE_DEC_COLOR = 13;
    static PHEREMONE_RELEASE = 14;
    static HEAD_INC_COLOR = 15;
    static HEAD_DEC_COLOR = 16;
    static TAIL_INC_COLOR = 17;
    static TAIL_DEC_COLOR = 18;
    static SOUND_INC_FREQ = 19;
    static SOUND_DEC_FREQ = 20;
    static CHIRP = 21;
    static NUM_AI_ACTIONS = 22;
    // Additional player actions
    static GRAB_RELEASE = 22;
    static MUCK_SNAKE = 23;
    static SAVE_SNAKE_MODEL = 24;
    static PUNISH = 25;
    static REWARD = 26;
    static WORLD_MOVE_L = 27;
    static WORLD_MOVE_R = 28;
    static WORLD_MOVE_U = 29;
    static WORLD_MOVE_D = 30;
    static WORLD_TURN_CW = 31;
    static WORLD_TURN_CCW = 32;
    static WORLD_INCREASE_WIDTH = 33;
    static WORLD_DECREASE_WIDTH = 34;
    static WORLD_INCREASE_HEIGHT = 35;
    static WORLD_DECREASE_HEIGHT = 36;
    static WORLD_EDIT = 37;
    static NUM_PLAYER_ACTIONS = 38;
}

class Snake {
    static INITIAL_LENGTH = 20;
    static HEAD_WIDTH = 10;
    static TAIL_WIDTH = 5;
    static LINK_OFFSET = 1.5;
    static VISION_DEPTH = 50;
    static COLL_FILTER = { category: CollisionLayer.SNAKE, mask: CollisionLayer.SNAKE_MASK };
    /**
     * @param {Brain} brain
     * @param {Vector} headPos
     * @param {string} name
     */
    constructor(brain, headPos, name) {
        /**
         * @type {Brain}
         */
        this.brain = brain;
        brain.setOwnerSnake(this);
        /**
         * @type {Matter.Composite}
         */
        this.body = Matter.Composite.create();
        /**
         * @type {Matter.Body[]}
         */
        this.segments = [];
        /**
         * @type {Object}
         */
        this.collisionFilter = { group: Matter.Body.nextGroup(true), ...this.constructor.COLL_FILTER };
        var head = Matter.Bodies.circle(headPos.x, headPos.y, Snake.HEAD_WIDTH, {
            collisionFilter: this.collisionFilter,
            frictionAir: 0.1,
            plugin: { snake: this }
        });
        Matter.Composite.add(this.body, head);
        this.segments.push(head);
        this.growBy(Snake.INITIAL_LENGTH);
        /**
         * @type {number}
         */
        this.depthOfVision = Snake.VISION_DEPTH;
        /**
         * @type {string}
         */
        this.name = name || Linnaeus.randomBinomial();
        /**
         * @type {number}
         */
        this.energy = 1000;
        /**
         * @type {number}
         */
        this.rewardEffect = 0;
        /**
         * @type {Snake?}
         */
        this.tailSnake = null;
        /**
         * @type {Snake?}
         */
        this.headSnake = null;
        /**
         * @type {number}
         */
        this.soundVolume = 0;
        // Integrating state variables
        /**
         * @type {number}
         */
        this.tongueAngle = 0;
        /**
         * @type {number}
         */
        this.tongueLength = 0.5;
        /**
         * @type {number}
         */
        this.pheremoneHue = 0;
        /**
         * @type {number}
         */
        this.headHue = 0.7;
        /**
         * @type {number}
         */
        this.tailHue = 0.3;
        /**
         * @type {number}
         */
        this.soundFreq = 440;
    }
    /**
     * @param {number} amount number of segments to add
     */
    growBy(amount) {
        for (var i = 0; i < amount; i++) {
            var newBody = Matter.Bodies.circle(this.tail.position.x, this.tail.position.y, Snake.HEAD_WIDTH, {
                collisionFilter: this.collisionFilter,
                frictionAir: 0.1,
                plugin: { snake: this },
                angle: this.tail.angle,
            });
            var pin = Matter.Constraint.create({
                bodyA: this.tail,
                bodyB: newBody,
                pointA: new Vector(0, -Snake.LINK_OFFSET).rotate(this.tail.angle),
                pointB: new Vector(0, Snake.LINK_OFFSET).rotate(this.tail.angle),
                stiffness: 1,
                length: 0,
            });
            var spring = Matter.Constraint.create({
                bodyA: this.tail,
                bodyB: newBody,
                pointA: new Vector(0, Snake.LINK_OFFSET).rotate(this.tail.angle),
                pointB: new Vector(0, -Snake.LINK_OFFSET).rotate(this.tail.angle),
                stiffness: 1,
                length: Snake.LINK_OFFSET * 5, // * 4 is the nominal length but need to push to keep snake straight
            });
            Matter.Composite.add(this.body, newBody);
            Matter.Composite.add(this.body, pin);
            Matter.Composite.add(this.body, spring);
            this.segments.push(newBody);
        }
        // scale segments to linearly decrease in size
        for (var i = 0; i < this.length; i++) {
            var body = this.segments[i];
            var targetSize = map(i, 0, this.length, Snake.HEAD_WIDTH, Snake.TAIL_WIDTH);
            var actualSize = body.circleRadius;
            var factor = targetSize / actualSize;
            Matter.Body.scale(body, factor, factor);
        }
    }
    /**
     * @type {Matter.Body}
     * @readonly
     */
    get head() {
        return this.segments[0];
    }
    /**
     * @type {Matter.Body}
     * @readonly
     */
    get tail() {
        return this.segments[this.segments.length - 1];
    }
    /**
     * @type {number}
     * @readonly
     */
    get length() {
        return this.segments.length;
    }
    /**
     * @param {Snake} other
     */
    listenTo(other) {
        if (other === this) return;
        var sourcePosition = new Vector(0, 20).rotate(other.head.angle).plus(other.head.position);
        var displacementFromSelf = new Vector(this.head.position).minus(sourcePosition).rotate(-this.head.angle);
        this.brain.pushSoundSource({ angle: displacementFromSelf.angle(), freq: other.soundFreq, volume: other.soundVolume * (0.6 ** displacementFromSelf.length()) });
    }
    /**
     * @param {Snake} snake
     * @param {Vector} normal
     * @param {Matter.Body} selfBody
     */
    touchedObject(snake, normal, selfBody) {
        if (snake) {
            if (Matter.Query.collides(this.head, [snake.tail])) this.headSnake = snake;
            if (Matter.Query.collides(this.tail, [snake.head])) this.tailSnake = snake;
        }
        var isLeft = normal.rotate(selfBody.angle).x < 0;
        this.brain.pushTouch(this.segments.indexOf(selfBody) / this.length, isLeft);
    }
    /**
     * @param {Level} currentLevel
     */
    tickWorld(currentLevel) {
        // update reactive display colors
        for (var i = 0; i < this.length; i++) {
            var segment = this.segments[i];
            var hue = map(i, 0, this.length, this.headHue, this.tailHue);
            var sat = map(new Vector(segment.velocity).length(), 0, 10, 0.5, 1);
            var val = map(this.energy, 0, 500, 0.25, 1);
            segment.render = {
                visible: true,
                opacity: 1,
                strokeStyle: null,
                fillStyle: Color.hsv(hue, sat, val).toCSSStr(),
                lineWidth: 0,
            };
        }
        // execute action determined by brain
        this.brain.scan(currentLevel)
        this.brain.think().forEach(a => this.executeAction(a, currentLevel));
        // process reward
        this.brain.learn(this.rewardEffect);
        this.rewardEffect *= 0.85;
        if (Math.abs(this.rewardEffect) < 3) this.rewardEffect = 0;
        // quiet down gradually
        this.soundVolume *= 0.92;
        if (this.soundVolume < 0.1) this.soundVolume = 0;
        // remove the references to bumped snakes
        this.headSnake = this.tailSnake = null;
        // slowly regenerate energy
        this.energy += 0.005;
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get forward() {
        return new Vector(0, 1).rotate(this.head.angle);
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get tongueTipRel() {
        return this.forward.rotate(this.tongueAngle).scale(map(this.tongueLength, 0, 1, Snake.HEAD_WIDTH, this.depthOfVision));
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get tongueTip() {
        return this.tongueTipRel.plus(this.head.position);
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        this.drawBody(ctx);
        this.drawEyes(ctx);
        this.drawTongue(ctx);
        this.drawName(ctx);
        ctx.restore();
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    drawBody(ctx) {
        ctx.save();
        if (this.rewardEffect != 0) {
            ctx.shadowColor = this.rewardEffect > 0 ? "lime" : "red";
            ctx.shadowBlur = clamp(Math.abs(this.rewardEffect), 0, 10);
        }
        for (var i = this.length - 1; i >= 1; i--) {
            var c = this.segments[i];
            var d = this.segments[i - 1];
            fatLine(ctx, c.position, d.position, d.circleRadius * 2, d.render.fillStyle);
        }
        if (this.rewardEffect != 0) {
            ctx.shadowBlur = 0;
            // Draw again to remove shadow over body
            for (var i = this.length - 1; i >= 1; i--) {
                var c = this.segments[i];
                var d = this.segments[i - 1];
                fatLine(ctx, c.position, d.position, d.circleRadius * 2, d.render.fillStyle);
            }
        }
        ctx.restore();
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    drawEyes(ctx) {
        dotAt(ctx, this.forward.scale(Snake.HEAD_WIDTH / 2).rotate(+1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        dotAt(ctx, this.forward.scale(Snake.HEAD_WIDTH / 2).rotate(-1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    drawTongue(ctx) {
        ctx.save();
        var tongueP1 = this.tongueTipRel.normalize(Snake.HEAD_WIDTH).plus(this.head.position);
        var tongueP2 = this.tongueTip;
        ctx.strokeStyle = "red";
        ctx.lineWidth = Snake.HEAD_WIDTH / 3;
        ctx.lineCap = ctx.lineJoin = "butt";
        ctx.beginPath();
        ctx.moveTo(tongueP1.x, tongueP1.y);
        ctx.lineTo(tongueP2.x, tongueP2.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    drawName(ctx) {
        // draw name
        var left = this.head.position.x;
        var top = this.head.position.y - Snake.HEAD_WIDTH * 1.3;
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.2;
        ctx.fillText(this.name, left, top);
        ctx.strokeText(this.name, left, top);
    }
    /**
     * scrunches the snake up onto itself to expand again.
     * @param {Vector} position
     * @param {number} angle
     */
    scrunch(position, angle) {
        for (var b of this.segments) {
            Matter.Body.set(b, {
                position: new Vector(position),
                angle: angle,
                velocity: new Vector(0, 0),
                angularVelocity: 0,
            });
        }
    }
    /**
     * Does the action thought up by the brain.
     * @param {number} action
     * @param {Level} level
     */
    executeAction(action, level) {
        switch (action) {
            case Action.NOTHING:
                break;
            case Action.FORWARD:
                if (this.energy > 1) {
                    this.energy--;
                    Matter.Body.applyForce(this.head, this.head.position, new Vector(0, 0.01).rotate(this.head.angle));
                } else this.autoPunish("Not enough energy to move.");
                break;
            case Action.LEFT:
                this.head.torque -= 0.01;
                break;
            case Action.RIGHT:
                this.head.torque += 0.01;
                break;
            case Action.TONGUE_OUT:
                this.tongueLength = clamp(this.tongueLength + 0.01, 0, 1);
                break;
            case Action.TONGUE_IN:
                this.tongueLength = clamp(this.tongueLength - 0.01, 0, 1);
                break;
            case Action.TONGUE_LEFT:
                this.tongueAngle = clamp(this.tongueAngle - 0.01, -Math.PI / 2, Math.PI / 2);
                break;
            case Action.TONGUE_RIGHT:
                this.tongueAngle = clamp(this.tongueAngle - 0.01, -Math.PI / 2, Math.PI / 2);
                break;
            case Action.EAT:
                var p = Matter.Query.point(level.foodParticles.map(p => p.body), this.tongueTip).map(b => b.plugin.particle);
                if (p) p.forEach(p => {
                    this.energy += p.size;
                    p.markEaten();
                });
                else this.autoPunish("Nothing to eat.");
                break;
            case Action.MATE_H:
                if (this.headSnake) {
                    //todo("mate using head snake");
                } else this.autoPunish("No snake to mate with.");
                break;
            case Action.MATE_T:
                if (this.tailSnake) {
                    //todo("mate using tail snake");
                } else this.autoPunish("No snake to mate with.");
                break;
            case Action.GROW:
                if (this.energy > 10 + this.length) {
                    this.energy -= 10 + this.length;
                    this.growBy(1);
                } else this.autoPunish("Not enough energy to grow.");
            case Action.PHEREMONE_INC_COLOR:
                this.pheremoneHue = (this.pheremoneHue + 1 / 360) % 1;
                break;
            case Action.PHEREMONE_DEC_COLOR:
                this.pheremoneHue = (this.pheremoneHue - 1 / 360) % 1;
                break;
            case Action.PHEREMONE_RELEASE:
                if (this.energy > 2) {
                    this.energy -= 2;
                    level.addParticle(new Pheremone(
                        gauss(Snake.TAIL_WIDTH, 1),
                        this.pheremoneHue,
                        this.forward.scale(Snake.HEAD_WIDTH * 2)
                            .plus(this.head.position)));
                } else this.autoPunish("Not enough energy to release pehermones.");
                break;
            case Action.HEAD_INC_COLOR:
                this.headHue = (this.headHue + 1 / 360) % 1;
                break;
            case Action.HEAD_DEC_COLOR:
                this.headHue = (this.headHue - 1 / 360) % 1;
                break;
            case Action.TAIL_INC_COLOR:
                this.tailHue = (this.tailHue + 1 / 360) % 1;
                break;
            case Action.TAIL_DEC_COLOR:
                this.tailHue = (this.tailHue - 1 / 360) % 1;
                break;
            case Action.SOUND_INC_FREQ:
                this.soundFreq = clamp(this.soundFreq * Math.exp(Math.LOG2E / 12), 110, 7040);
                break;
            case Action.SOUND_DEC_FREQ:
                this.soundFreq = clamp(this.soundFreq / Math.exp(Math.LOG2E / 12), 110, 7040);
                break;
            case Action.CHIRP:
                this.soundVolume = 1;
                break;
            default:
                throw new Error(`unimplemented action for ${this.constructor.name}: ${action} (Action.${Object.keys(Action).find(b => Action[b] == action) || " ???"})`);
        }
    }
    /**
     * @param {string} message
     */
    autoPunish(message) {
        // if (false)
        this.addReward({ rewardAmount: -100, setEaten() { } });
    }
    /**
     * @param {RewardSignal} sig
     */
    addReward(sig) {
        var amount = sig.rewardAmount;
        if (this.rewardEffect * amount < 0) {
            // wrong sign
            this.rewardEffect = amount;
        }
        else {
            this.rewardEffect += amount;
        }
        sig.setEaten();
    }
}

class PlayerSnake extends Snake {
    static COLL_FILTER = { category: CollisionLayer.SNAKE, mask: CollisionLayer.PLAYER_MASK };
    constructor(brain, pos, name) {
        super(brain, pos, name);
        /**
         * @type {Toast}
         */
        this.errortoast = new Toast(500);
    }
    addReward(sig) {
        var amount = sig.rewardAmount;
        if (this.rewardEffect * amount < 0) {
            // wrong sign
            this.rewardEffect = amount;
        }
        else {
            this.rewardEffect += amount;
        }
        this.rewardEffect = clamp(this.rewardEffect, -20, 20);
        // Reward amount does nothing except show the outline
    }
    autoPunish(message) {
        this.errortoast.show(message, "error");
    }
}
