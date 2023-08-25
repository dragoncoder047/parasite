class Vector {
    /**
     * @param {number | {x: number, y: number}} x
     * @param {number | undefined} y
     */
    constructor(x, y) {
        if (typeof y === "undefined") {
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
        if (isNaN(this.x) || isNaN(this.y)) throw new TypeError("strange NaN");
    }
    /**
     * Applies the function to the vector's x- and y-coordinates.
     * @param {(number) => number} fun
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
     * Angle of the vector.
     * @returns {number}
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }
    /**
     * @param {number} tgtLength
     * @returns {Vector}
     */
    normalize(tgtLength = 1) {
        return this.scale(tgtLength / this.length());
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
    /**
     * rotate around origin
     * @param {number} theta Angle in radians
     * @returns {Vector}
     */
    rotate(theta) {
        var cosine = Math.cos(theta), sine = Math.sin(theta);
        return new Vector(this.x * cosine - this.y * sine, this.x * sine + this.y * cosine);
    }
}
