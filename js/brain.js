class Brain {
    /**
     * @param {Snake} snake
     */
    constructor(snake) {
        /**
         * @type {Snake}
         */
        this.snake = snake;
        // TODO: bins for memory
    }
    /**
     * @abstract
     */
    think() {
        throw new Error("abstract method called");
    }
    scanWorld(world) {
        for (var i = 0; i < 5; i++) this.scanBin(i, world);
    }
    scanBin(bin, world) {
        var binCenterAngle = Math.PI / 4 * (bin - 2);
        var forward = new Vector(0, this.snake.depthOfVision).rotate(binCenterAngle);
        var hits = [];
        for (var theta = 0; theta < Math.PI / 4; theta += 0.001) {
            // TODO
        }
    }
}
