class Block {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Vector} position
     * @param {Object} collisionFilter
     * @param {boolean} isStatic
     * @param {string} fillStyle
     */
    constructor(width, height, position, collisionFilter, isStatic, fillStyle) {
        /**
         * @type {Matter.Body}
         */
        this.body = Matter.Bodies.rectangle(position.x, position.y, width, height, {
            plugin: {
                block: this,
                width,
                height
            },
            collisionFilter,
            isStatic,
            render: { fillStyle },
            frictionAir: 0.1,
        });
        // /**
        //  * @type {Matter.Composite}
        //  */
        // this.body = Matter.Composite.create();
        // Matter.Composite.add(this.body, this.body);
    }
    /**
     * @type {number}
     */
    get width() {
        return this.body.plugin.width;
    }
    /**
     * @type {number}
     */
    get height() {
        return this.body.plugin.height;
    }
    /**
     * @type {number}
     */
    set width(newVal) {
        if (typeof newVal !== "number") throw new Error("strange width");
        var ratio = newVal / this.width;
        var v = new Vector(ratio, 1).rotate(this.body.angle);
        Matter.Body.scale(this.body, v.x, v.y);
        this.body.plugin.width = newVal;
    }
    /**
     * @type {number}
     */
    set height(newVal) {
        if (typeof newVal !== "number") throw new Error("strange height");
        var ratio = newVal / this.height;
        var v = new Vector(1, ratio).rotate(this.body.angle);
        Matter.Body.scale(this.body, v.x, v.y);
        this.body.plugin.height = newVal;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        ctx.translate(this.body.position.x - this.width / 2, this.body.position.y - this.height / 2);
        ctx.rotate(this.body.angle);
        ctx.fillStyle = this.body.render.fillStyle;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }
    tickWorld() {
        // noop;
    }
}

class Wall extends Block {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Vector} position
     */
    constructor(width, height, position) {
        super(width, height, position, { category: CollisionLayer.WALL, mask: CollisionLayer.WALL_MASK }, true, "darkblue");
    }
}

class Glass extends Block {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Vector} position
     */
    constructor(width, height, position) {
        super(width, height, position, { category: CollisionLayer.WALL, mask: CollisionLayer.WALL_MASK }, false, "brickred");
    }
}

class Grate extends Block {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Vector} position
     */
    constructor(width, height, position) {
        super(width, height, position, { category: CollisionLayer.GRATE, mask: CollisionLayer.GRATE_MASK }, true, "darkgreen");
    }
}
