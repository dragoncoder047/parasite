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
        this.body = Matter.Bodies.rectangle(position.x, position.y, width, height, {
            plugin: {
                block: this,
                width,
                height
            },
            collisionFilter,
            isStatic,
            render: { fillStyle }
        });
    }
    get width() {
        return this.body.plugin.width;
    }
    get height() {
        return this.body.plugin.height;
    }
    set width(newVal) {
        if (typeof newVal !== "number") throw new Error("strange width");
        var ratio = newVal / this.width;
        Matter.Body.scale(this.body, ratio, 1);
        this.body.plugin.width = newVal;
    }
    set height(newVal) {
        if (typeof newVal !== "number") throw new Error("strange height");
        var ratio = newVal / this.height;
        Matter.Body.scale(this.body, 1, ratio);
        this.body.plugin.height = newVal;
    }
    renderTo(ctx) {
        ctx.save();
        ctx.translate(this.body.position.x - this.width / 2, this.body.position.y - this.height / 2);
        ctx.rotate(this.body.angle);
        ctx.fillStyle = this.body.render.fillStyle;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
    tickWorld() {
        // noop;
    }
}
