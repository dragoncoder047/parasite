class Color {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    constructor(r, g, b) {
        /**
         * @type {number}
         */
        this.r = r | 0;
        /**
         * @type {number}
         */
        this.g = g | 0;
        /**
         * @type {number}
         */
        this.b = b | 0;
    }
    toCSSStr() {
        return `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`;
    }
    /**
     * @param {number} h
     * @param {number} s
     * @param {number} v
     * @returns {Color}
     */
    static hsv(h, s, v) {
        // From https://stackoverflow.com/a/17243070
        var r, g, b, i, f, p, q, t;
        h = clamp(h, 0, 1);
        s = clamp(s, 0, 1);
        v = clamp(v, 0, 1);
        i = (h * 6) | 0;
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return new Color(r * 255, g * 255, b * 255);
    }
    /**
     * @param {number} x
     * @param {number} a
     * @param {number} b
     * @param {Color} c
     * @param {Color} d
     * @param {boolean} k
     * @returns {Color}
     */
    static map2(x, a, b, c, d, k=true) {
        return new Color(map(x, a, b, c.r, d.r, k), map(x, a, b, c.g, d.g, k), map(x, a, b, c.b, d.b, k));
    }
}