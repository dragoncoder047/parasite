class Snake {
    static INITIAL_LENGTH = 30;
    static HEAD_WIDTH = 10;
    static TAIL_WIDTH = 5;
    static LINK_OFFSET = 4;
    static VISION_DEPTH = 25;
    static DEFAULT_COLL_FILTER = { category: CollisionLayer.SNAKE, mask: CollisionLayer.SNAKE_MASK };
    /**
     * @param {Brain} brain
     * @param {Vector} headPos
     */
    constructor(brain, headPos) {
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
    }
    /**
     * @param {number} amount number of segments to add
     */
    growBy(amount) {
        var last = this.body.bodies[this.body.bodies.length - 1];
        for (var i = 0; i < amount; i++) {
            var newBody = Matter.Bodies.circle(last.position.x, last.position.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.5 });
            Matter.Composite.add(this.body, newBody);
            newBody.plugin.snake = this;
            var constraint = Matter.Constraint.create({
                bodyA: last,
                bodyB: newBody,
                pointA: Matter.Vector.create(0, -Snake.LINK_OFFSET / 2),
                pointB: Matter.Vector.create(0, Snake.LINK_OFFSET / 2),
                stiffness: 1,
                length: 0,
            });
            Matter.Composite.add(this.body, constraint);
            last = newBody;
        }
        // scale segments to linearly decrease in size
        for (var i = 0; i < this.length; i++) {
            var body = this.body.bodies[i];
            var targetSize = map(i, 0, this.length, Snake.HEAD_WIDTH, Snake.TAIL_WIDTH);
            var actualSize = body.circleRadius;
            var factor = targetSize / actualSize;
            Matter.Body.scale(body, factor, factor);
        }
        // update display colors
        for (var i = 0; i < this.length; i++) {
            var segment = this.body.bodies[i];
            var color = Color.map2(i, 0, this.length, this.brain.mood[0], this.brain.mood[1], false);
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
        this.body.bodies.forEach(body => body.collisionFilter.mask = mask);
    }
    /**
     * @type {number}
     * @readonly
     */
    get length() {
        return this.body.bodies.length;
    }
    tickWorld() {
        //noop;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        var forward = new Vector(0, 1).rotate(this.head.angle);
        // draw body
        for (var c of this.body.bodies.reverse()) dotAt(ctx, c.position, c.circleRadius, c.render.fillStyle);
        // draw eyes
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(+1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(-1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
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
        ctx.restore();
    }
}
