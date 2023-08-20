/**
 * @typedef {TBD} Goal
 */

class Level {
    /**
     * @param {Goal} goal
     */
    constructor(goal) {
        /**
         * @type {Matter.Engine}
         */
        this.physicsEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
        /**
         * @type {Matter.World}
         */
        this.physicsWorld = this.physicsEngine.world;
        /**
         * @type {Goal}
         */
        this.goal = goal;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    renderTo(ctx) {
        throw new Error("Not implemented");
    }
}