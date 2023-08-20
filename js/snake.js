class Snake {
    static initialLength = 10;
    static headWidth = 10;
    static tailWidth = 5;
    static circleSize = (Snake.headWidth + Snake.tailWidth) / 2;
    static segmentLength = 2;
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
         * @type {number}
         */
        this.group = Body.nextGroup(true);
        Matter.Composite.addBody(this.segments, Matter.Bodies.circle(headPos.x, headPos.y, Snake.circleSize, { collisionFilter: { group: this.group } }));
        this.growBy(Snake.initialLength);
    }
    growBy(amount) {
        for (var i = 0; i < amount; i++) this.addSegment();
    }
    addSegment() {
        var last = this.segments.bodies[this.segments.length - 1];
        var newBody = Matter.Bodies.circle(last.position.x, last.position.y, Snake.circleSize, { collisionFilter: { group: this.group } });
        Matter.Composite.addBody(this.segments, newBody);
        var constraint = Matter.Constraint.create({
            bodyA: last,
            bodyB: newBody,
            pointA: Matter.Vector.create(0, Snake.circleSize / 2),
            pointB: Matter.Vector.create(0, -Snake.circleSize / 2),
            stiffness: 0.25,
            length: 0,
        });
        Matter.Composite.addConstraint(this.segments, constraint);
    }
    get head() {
        return this.segments[0];
    }
}
