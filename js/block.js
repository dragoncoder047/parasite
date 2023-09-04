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
        var angle = this.body.angle;
        Matter.Body.rotate(this.body, -angle);
        Matter.Body.scale(this.body, ratio, 1);
        Matter.Body.rotate(this.body, angle);
        Matter.Sleeping.set(this.body, false);
        this.body.plugin.width = newVal;
    }
    /**
     * @type {number}
     */
    set height(newVal) {
        if (typeof newVal !== "number") throw new Error("strange height");
        var ratio = newVal / this.height;
        var angle = this.body.angle;
        Matter.Body.rotate(this.body, -angle);
        Matter.Body.scale(this.body, 1, ratio);
        Matter.Body.rotate(this.body, angle);
        Matter.Sleeping.set(this.body, false);
        this.body.plugin.height = newVal;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        ctx.save();
        ctx.fillStyle = this.body.render.fillStyle;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        var vl = this.body.parts[0].vertices;
        for (var i = 0; i <= vl.length; i++) {
            var v = vl[i % vl.length];
            if (i === 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.fill();
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
