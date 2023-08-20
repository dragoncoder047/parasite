/**
 * @type {Matter.Body}
 * @property {Snake} snake
 */

class Snake {
    static initialLength = 10;
    static headWidth = 10;
    static tailWidth = 5;
    static circleSize = (Snake.headWidth + Snake.tailWidth) / 2;
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
        this.collisionFilter = { group: Body.nextGroup(true), category: CollisionLayer.ALL, mask: CollisionLayer.ALL };
        Matter.Composite.addBody(this.segments, Matter.Bodies.circle(headPos.x, headPos.y, Snake.circleSize, { collisionFilter: this.collisionFilter }));
        this.head.plugin.snake = this;
        this.growBy(Snake.initialLength);
    }
    growBy(amount) {
        for (var i = 0; i < amount; i++) this.addSegment();
    }
    addSegment() {
        var last = this.segments.bodies[this.segments.length - 1];
        var newBody = Matter.Bodies.circle(last.position.x, last.position.y, Snake.circleSize, { collisionFilter: this.collisionFilter });
        Matter.Composite.addBody(this.segments, newBody);
        newBody.plugin.snake = this;
        var constraint = Matter.Constraint.create({
            bodyA: last,
            bodyB: newBody,
            pointA: Matter.Vector.create(0, Snake.circleSize / 2),
            pointB: Matter.Vector.create(0, -Snake.circleSize / 2),
            stiffness: 0.8,
            length: 0,
        });
        Matter.Composite.addConstraint(this.segments, constraint);
    }
    /**
     * @type {Matter.Body}
     * @readonly
     */
    get head() {
        return this.segments.bodies[0];
    }
}
