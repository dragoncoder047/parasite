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
        this.body = Matter.Bodies.circle(position.x, position.y, size, {
            collisionFilter,
            render: { fillStyle: Color.hsv(hue, 1, 1).toCSSStr() },
            plugin: { particle: this },
            frictionAir: 0
        });
        /**
         * @type {boolean}
         */
        this.eaten = this.size < 0;
    }
    setEaten() {
        if (this.eaten) return;
        this.eaten = true;
        this.body.collisionFilter = { mask: 0, category: 0 };
    }
    tickWorld() {
        // noop;
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
        ctx.arc(0, 0, this.body.circleRadius, 0, Math.PI * 2, false);
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

class FoodParticle extends Particle {
    /**
     * @param {number} size
     * @param {Vector} position
     * @param {Vector} velocity
     */
    constructor(size, position, velocity) {
        super(size / 5, 0, position, { category: CollisionLayer.FOOD, mask: CollisionLayer.FOOD_MASK });
        Matter.Body.setVelocity(this.body, velocity);
        this.body.render.fillStyle = "white";
    }
    get size() {
        return this.body.circleRadius * 5;
    }
}

class Pheremone extends Particle {
    /**
     * @param {number} size
     * @param {number} hue
     * @param {Vector} position
     */
    constructor(size, hue, position) {
        super(size, hue, position, { category: CollisionLayer.PHEREMONE, mask: CollisionLayer.PHEREMONE_MASK });
        /**
         * @type {number}
         */
        this.hue = hue;
    }
    tickWorld() {
        // Pheremones decay over time
        Matter.Body.scale(this.body, 0.999, 0.999);
        if (this.size < 2) this.setEaten();
    }
    renderTo(ctx) {
        ctx.save();
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.body.render.fillStyle;
        super.renderTo(ctx);
        ctx.restore();
    }
}

class RewardSignal extends Particle {
    constructor(rewardAmount, position, velocity) {
        super(2, 0, position, { category: CollisionLayer.PHEREMONE, mask: CollisionLayer.PHEREMONE_MASK });
        Matter.Body.setVelocity(this.body, velocity);
        /**
         * @type {number}
         */
        this.rewardAmount = rewardAmount;
        this.body.render.fillStyle = this.rewardAmount > 0 ? "lime" : "red";
        /**
         * @type {Number}
         */
        this.timeCreated = Date.now();
    }
    tickWorld() {
        // Limit max age of a particle to 10 seconds.
        if (Date.now() - this.timeCreated > 10000) this.setEaten();
    }
}
