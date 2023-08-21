/**
 * @param {number} x 0-1 range
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
function lerp(x, lo, hi) {
    return x * (hi - lo) + lo;
}

/**
 * @param {number} x 0-1 range
 * @param {Color} c1
 * @param {Color} c2
 * @returns {Color}
 */
function lerpColor(x, c1, c2) {
    return { r: lerp(x, c1.r, c2.r)|0, g: lerp(x, c1.g, c2.g)|0, b: lerp(x, c1.b, c2.b)|0 };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Vector} position
 * @param {number} radius
 * @param {string} fillColor
 */
function dotAt(ctx, position, radius, fillColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

class Snake {
    static INITIAL_LENGTH = 30;
    static HEAD_WIDTH = 10;
    static TAIL_WIDTH = 5;
    static LINK_OFFSET = 4;
    static VISION_DEPTH = 25;
    /**
     * @param {Brain} brain
     * @param {Vector} headPos
     */
    constructor(brain, headPos) {
        /**
         * @type {Brain}
         */
        this.brain = brain;
        /**
         * @type {Matter.Composite}
         */
        this.segments = Matter.Composite.create();
        /**
         * @type {Object}
         */
        this.collisionFilter = { group: Matter.Body.nextGroup(true), category: CollisionLayer.ALL, mask: CollisionLayer.ALL };
        /**
         * @type {Matter.Body}
         */
        this.head = Matter.Bodies.circle(headPos.x, headPos.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.5 });
        Matter.Composite.addBody(this.segments, this.head);
        this.head.plugin.snake = this;
        /**
         * @type {Matter.Body}
         */
        this.tail = null;
        this.growBy(Snake.INITIAL_LENGTH);
        /**
         * @type {number}
         */
        this.depthOfVision = Snake.VISION_DEPTH;
    }
    /**
     * @param {number} amount number of segments to add
     */
    growBy(amount) {
        var last = this.segments.bodies[this.segments.bodies.length - 1];
        for (var i = 0; i < amount; i++) {
            var newBody = Matter.Bodies.circle(last.position.x, last.position.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.5 });
            Matter.Composite.addBody(this.segments, newBody);
            newBody.plugin.snake = this;
            var constraint = Matter.Constraint.create({
                bodyA: last,
                bodyB: newBody,
                pointA: Matter.Vector.create(0, -Snake.LINK_OFFSET / 2),
                pointB: Matter.Vector.create(0, Snake.LINK_OFFSET / 2),
                stiffness: 1,
                length: 0,
                render: {
                    visible: false,
                }
            });
            Matter.Composite.addConstraint(this.segments, constraint);
            last = newBody;
        }
        this.tail = last;
        // scale segments to linearly decrease in size
        for (var i = 0; i < this.length; i++) {
            var body = this.segments.bodies[i];
            var targetSize = lerp(i / this.length, Snake.HEAD_WIDTH, Snake.TAIL_WIDTH);
            var actualSize = body.circleRadius;
            var factor = targetSize / actualSize;
            Matter.Body.scale(body, factor, factor);
        }
        // update display colors
        for (var i = 0; i < this.length; i++) {
            var segment = this.segments.bodies[i];
            var color = lerpColor(i / this.length, this.brain.mood[0], this.brain.mood[1]);
            var style = `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
            segment.render = {
                visible: true,
                opacity: 1,
                strokeStyle: null,
                fillStyle: style,
                lineWidth: 0,
            };
        }
    }
    /**
     * @type {number}
     * @readonly
     */
    get length() {
        return this.segments.bodies.length;
    }
    tickWorld() {
        //noop;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        var forward = new Vector(0, 1).rotate(this.head.angle);
        // draw body
        for (var c of this.segments.bodies.reverse()) dotAt(ctx, c.position, c.circleRadius, c.render.fillStyle);
        // draw eyes
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(+1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black");
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(-1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black");
        // draw tongue
        var tongueAngle = forward.rotate(this.brain.tongueAngle);
        var tongueP1 = tongueAngle.scale(Snake.HEAD_WIDTH).plus(this.head.position);
        var tongueP2 = tongueAngle.scale(Snake.HEAD_WIDTH + this.brain.tongueLength).plus(this.head.position);
        ctx.strokeStyle = "red";
        ctx.lineWidth = Snake.HEAD_WIDTH / 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tongueP1.x, tongueP1.y);
        ctx.lineTo(tongueP2.x, tongueP2.y);
        ctx.closePath();
        ctx.stroke();
    }
}
