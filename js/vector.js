class Vector {
    constructor(x, y) {
        if (!y) {
            /**
             * @type {number}
             */
            this.y = x.y;
            /**
             * @type {number}
             */
            this.x = x.x;
        } else {
            this.x = x;
            this.y = y;
        }
    }
    /**
     * Applies the function to the vector's x- and y-coordinates.
     * @param {Function} fun
     * @param {Vector[]} vectors
     */
    static apply(fun, ...vectors) {
        return new Vector(fun(...vectors.map(v => v.x)), fun(...vectors.map(v => v.y)));
    }
    /**
     * Distance between two points.
     * @param {Vector} other
     * @returns {number}
     */
    distanceTo(other) {
        return this.minus(other).length();
    }
    /**
     * Length of the vector.
     * @returns {number}
     */
    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
    /**
     * this-other
     * @param {Vector} other
     * @returns {Vector}
     */
    minus(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }
    /**
     * this+other
     * @param {Vector} other
     * @returns {Vector}
     */
    plus(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }
    /**
    * this*k
    * @param {number} k 
    * @returns {Vector}
    */
    scale(k) {
        return new Vector(this.x * k, this.y * k);
    }
}
