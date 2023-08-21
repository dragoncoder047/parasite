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
    return { r: lerp(x, c1.r, c2.r), g: lerp(x, c1.g, c2.g), b: lerp(x, c1.b, c2.b) };
}

/**
 * @type {Matter.Body}
 * @property {Snake} snake
 */

class Snake {
    static initialLength = 50;
    static headWidth = 10;
    static tailWidth = 5;
    static linkLength = 4;
    static depthOfVision = 25;
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
        Matter.Composite.addBody(this.segments, Matter.Bodies.circle(headPos.x, headPos.y, Snake.headWidth, { collisionFilter: this.collisionFilter, frictionAir: 0.5 }));
        this.head.plugin.snake = this;
        this.growBy(Snake.initialLength);
        /**
         * @type {number}
         */
        this.depthOfVision = Snake.depthOfVision;
    }
    /**
     * @param {number} amount number of segments to add
     */
    growBy(amount) {
        var last = this.segments.bodies[this.segments.bodies.length - 1];
        for (var i = 0; i < amount; i++) {
            var newBody = Matter.Bodies.circle(last.position.x, last.position.y, Snake.headWidth, { collisionFilter: this.collisionFilter, frictionAir: 0.5 });
            Matter.Composite.addBody(this.segments, newBody);
            newBody.plugin.snake = this;
            var constraint = Matter.Constraint.create({
                bodyA: last,
                bodyB: newBody,
                pointA: Matter.Vector.create(0, Snake.linkLength / 2),
                pointB: Matter.Vector.create(0, -Snake.linkLength / 2),
                stiffness: 0.8,
                length: 0,
                render: {
                    visible: false,
                }
            });
            Matter.Composite.addConstraint(this.segments, constraint);
            last = newBody;
        }
        // scale segments to linearly decrease in size
        for (var i = 0; i < this.length; i++) {
            var body = this.segments.bodies[i];
            var targetSize = lerp(i / this.length, Snake.headWidth, Snake.tailWidth);
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
        return this.segments.bodies[0];
    }
    /**
     * @type {Matter.Body}
     * @readonly
     */
    get tail() {
        return this.segments.bodies[this.length - 1];
    }
    /**
     * @type {number}
     * @readonly
     */
    get length() {
        return this.segments.bodies.length;
    }
    tickWorld() {
        if (this.clean) return;
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
        this.clean = true;
    }
}
