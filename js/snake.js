/**
 * @enum
 */
class Action {
    static FORWARD = 0;
    static BACKWARD = 1;
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
    static INITIAL_LENGTH = 30;
    static HEAD_WIDTH = 10;
    static TAIL_WIDTH = 5;
    static LINK_OFFSET = 1.5;
    static VISION_DEPTH = 50;
    static DEFAULT_COLL_FILTER = { category: CollisionLayer.SNAKE, mask: CollisionLayer.SNAKE_MASK };
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
        this.collisionFilter = { group: Matter.Body.nextGroup(true), ...Snake.DEFAULT_COLL_FILTER };
        var head = Matter.Bodies.circle(headPos.x, headPos.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.5 });
        Matter.Composite.add(this.body, head);
        this.segments.push(head);
        head.plugin.snake = this;
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
            var newBody = Matter.Bodies.circle(this.tail.position.x, this.tail.position.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.1, plugin: { snake: this } });
            Matter.Composite.add(this.body, newBody);
            var pin = Matter.Constraint.create({
                bodyA: this.tail,
                bodyB: newBody,
                pointA: new Vector(0, -Snake.LINK_OFFSET),
                pointB: new Vector(0, Snake.LINK_OFFSET),
                stiffness: 1,
                length: 0,
            });
            var spring = Matter.Constraint.create({
                bodyA: this.tail,
                bodyB: newBody,
                pointA: new Vector(0, Snake.LINK_OFFSET),
                pointB: new Vector(0, -Snake.LINK_OFFSET),
                stiffness: 1,
                length: Snake.LINK_OFFSET * 5, // * 4 is the nominal length but need to push to keep snake straight
            });
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
     * @param {number} mask
     */
    setCollisionMask(mask) {
        this.collisionFilter.mask = mask;
        this.segments.forEach(body => body.collisionFilter.mask = mask);
    }
    /**
     * @type {number}
     * @readonly
     */
    get length() {
        return this.segments.length;
    }
    tickWorld() {
        // update reactive display colors
        for (var i = 0; i < this.length; i++) {
            var segment = this.segments[i];
            var hue = map(i, 0, this.length, this.headHue, this.tailHue);
            var sat = map(new Vector(segment.velocity).length(), 0, 15, 0.5, 1);
            var val = map(this.energy, 0, 500, 0.1, 1);
            segment.render = {
                visible: true,
                opacity: 1,
                strokeStyle: null,
                fillStyle: Color.hsv(hue, sat, val).toCSSStr(),
                lineWidth: 0,
            };
        }
        // execute action determined by brain
        this.executeAction(this.brain.think());
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        var forward = new Vector(0, 1).rotate(this.head.angle);
        // draw body
        for (var i = this.length - 1; i >= 1; i--) {
            var c = this.segments[i];
            var d = this.segments[i - 1];
            fatLine(ctx, c.position, d.position, d.circleRadius * 2, d.render.fillStyle);
        }
        // draw eyes
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(+1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(-1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        // draw tongue
        var tongueAngle = forward.rotate(this.tongueAngle);
        var tongueP1 = tongueAngle.scale(Snake.HEAD_WIDTH).plus(this.head.position);
        var tongueP2 = tongueAngle.scale(Snake.HEAD_WIDTH + map(this.tongueLength, 0, 1, 0, this.depthOfVision)).plus(this.head.position);
        ctx.strokeStyle = "red";
        ctx.lineWidth = Snake.HEAD_WIDTH / 3;
        ctx.lineCap = ctx.lineJoin = "butt";
        ctx.beginPath();
        ctx.moveTo(tongueP1.x, tongueP1.y);
        ctx.lineTo(tongueP2.x, tongueP2.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
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
            b.position = new Vector(position);
            b.angle = angle;
        }
    }
    /**
     * Does the action thought up by the brain.
     * @param {number} action
     */
    executeAction(action) {
        switch (action) {
            case Action.FORWARD:
                Matter.Body.applyForce(this.head, this.head.position, new Vector(0, 0.01).rotate(this.head.angle));
                break;
            case Action.BACKWARD:
                Matter.Body.applyForce(this.head, this.head.position, new Vector(0, -0.01).rotate(this.head.angle));
                break;
            case Action.LEFT:
                this.head.torque += 0.01;
                break;
            case Action.RIGHT:
                this.head.torque -= 0.01;
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
                todo();
                var hits = Matter.Query.point(_, this.head.position);
                break;
        }
    }
    autoPunish() {
        if (false) this.brain.badIdea();
    }
}
