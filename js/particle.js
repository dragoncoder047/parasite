class Particle {
    /**
     * @param {number} size
     * @param {number} hue
     * @param {Vector} position
     * @param {Object} collisionFilter
     */
    constructor(size, hue, position, collisionFilter) {
        /**
         * @type {Matter.Body}
         */
        this.body = Matter.Bodies.circle(position.x, position.y, size, { collisionFilter, render: { fillStyle: Color.hsv(hue, 1, 1).toCSSStr() }, plugin: { particle: this } });
        /**
         * @type {boolean}
         */
        this.eaten = false;
    }
    setEaten() {
        if (this.eaten) return;
        this.eaten = true;
        this.body.collisionFilter = { mask: 0, category: 0 };
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        if (this.eaten) return;
        ctx.save();
        ctx.translate(this.body.position.x, this.body.position.y);
        ctx.fillStyle = this.body.render.fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, this.body.circlRadius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
    }
    /**
     * @type {number}
     * @readonly
     */
    get size() {
        return this.body.circleRadius;
    }
}
