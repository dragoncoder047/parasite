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
    }
    /**
     * @param {number} amount number of segments to add
     */
    growBy(amount) {
        for (var i = 0; i < amount; i++) {
            var newBody = Matter.Bodies.circle(this.tail.position.x, this.tail.position.y, Snake.HEAD_WIDTH, { collisionFilter: this.collisionFilter, frictionAir: 0.1 });
            Matter.Composite.add(this.body, newBody);
            newBody.plugin.snake = this;
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
        // update brain
        //todo;
        // move self
        //todo;
        // update display colors
        for (var i = 0; i < this.length; i++) {
            var segment = this.segments[i];
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
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        var forward = new Vector(0, 1).rotate(this.head.angle);
        // draw body
        for (var i = this.length - 1; i >= 0; i--) {
            var c = this.segments[i];
            dotAt(ctx, c.position, c.circleRadius, c.render.fillStyle);
        }
        // draw eyes
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(+1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        dotAt(ctx, forward.scale(Snake.HEAD_WIDTH / 2).rotate(-1).plus(this.head.position), Snake.HEAD_WIDTH / 4, "black", "white", 1);
        // draw tongue
        var tongueAngle = forward.rotate(this.brain.tongueAngle);
        var tongueP1 = tongueAngle.scale(Snake.HEAD_WIDTH).plus(this.head.position);
        var tongueP2 = tongueAngle.scale(Snake.HEAD_WIDTH + map(this.brain.tongueLength, 0, 1, 0, this.depthOfVision)).plus(this.head.position);
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
}
