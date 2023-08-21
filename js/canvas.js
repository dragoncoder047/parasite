/**
 * Finds the mouse position from the event on the canvas.
 * @param {HTMLCanvasElement} canvas The canvas
 * @param {MouseEvent|TouchEvent} evt The mouse event to get the coordinates on.
 * @returns {Vector}
 */
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var reportedXY;
    if (evt.touches) {
        reportedXY = [].map.call(evt.touches, t => new Vector(t.clientX, t.clientY)).reduce((a, b) => a.plus(b)).scale(1 / evt.touches.length);
    }
    else {
        reportedXY = { x: evt.clientX, y: evt.clientY };
    }
    return new Vector(
        (reportedXY.x - rect.left) / (rect.right - rect.left) * canvas.width,
        (reportedXY.y - rect.top) / (rect.bottom - rect.top) * canvas.height
    );
}


const M_LEFT = 0b000000000001;
const M_RIGHT = 0b00000000010;
const M_WHEEL = 0b00000000100;
const M_BACK = 0b000000001000;
const M_FORWARD = 0b000010000;
const K_ALT = 0b0000000100000;
const K_CTRL = 0b000001000000;
const K_META = 0b000010000000;
const K_SHIFT = 0b00100000000;
/**
 * Turns the event into a bit field that stores mouse buttons and modifier keys (alt, ctrl, etc.)
 * @param {UIEvent} e
 * @returns {number}
 */
function makeModifiers(e) {
    var out = e.buttons || 0;
    if (e.altKey) out |= K_ALT;
    if (e.ctrlKey) out |= K_CTRL;
    if (e.metaKey) out |= K_META;
    if (e.shiftKey) out |= K_SHIFT;
    return out;
}

class Canvas extends XEventEmitter {
    /**
     * @param {HTMLElement} main Container for canvas.
     */
    constructor(main) {
        super();
        var canvas = document.createElement("canvas");
        /**
         * @type {HTMLCanvasElement}
         */
        this.canvas = canvas;
        main.append(canvas);
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = canvas.getContext('2d');
        /**
         * @type {boolean}
         */
        this.mouseDown = false;
        /**
         * @type {number}
         */
        this.timeDown = 0;
        /**
         * @type {Vector}
         */
        this.panxy = new Vector(this.center);
        /**
         * @type {Vector}
         */
        this.downxy = new Vector(0, 0);
        /**
         * @type {Vector}
         */
        this.lastxy = new Vector(0, 0);
        canvas.addEventListener('mousedown', e => {
            this.mouseDown = true;
            this.timeDown = +new Date();
            this.downxy = getMousePos(canvas, e);
            this.lastxy = new Vector(this.downxy);
            this.emit('mousedown', this.downxy);
        });
        canvas.addEventListener('touchstart', e => {
            this.mouseDown = true;
            this.timeDown = +new Date();
            this.downxy = getMousePos(canvas, e);
            this.lastxy = new Vector(this.downxy);
            this.emit('mousedown', this.downxy);
        });
        canvas.addEventListener('mouseup', e => {
            this.mouseDown = false;
            this.emit('mouseup', this.lastxy);
            if (this.lastxy.distanceTo(this.downxy) < 16 && +new Date() - this.timeDown < 250) this.emit('click', this.downxy);
        });
        canvas.addEventListener('touchend', e => {
            this.mouseDown = false;
            this.emit(e, 'mouseup', this.lastxy);
            if (this.lastxy.distanceTo(this.downxy) < 16 && +new Date() - this.timeDown < 250) this.emit('click', this.downxy);
        });
        canvas.addEventListener('touchmove', e => {
            var xy = getMousePos(canvas, e);
            if (!this.mouseDown) {
                this.mouseDown = true;
                this.downxy = new Vector(xy);
                this.emit('mousedown', this.downxy);
            } else {
                this.emit('drag', xy.minus(this.lastxy));
            }
            this.lastxy = new Vector(xy);
        });
        canvas.addEventListener('mousemove', e => {
            var xy = getMousePos(canvas, e);
            if (!this.mouseDown) {
                this.emit('mouseover', xy);
            }
            else {
                this.emit('drag', xy.minus(this.lastxy));
            }
            this.lastxy = new Vector(xy);
        });
        canvas.addEventListener('wheel', e => {
            this.emit('scroll', { x: e.deltaX, y: e.deltaY });
        });
        canvas.addEventListener('keydown', e => this.emit('keydown', e.key));
        canvas.addEventListener('keyup', e => this.emit('keyup', e.key));
        // setup canvas resizing
        var dpr = window.devicePixelRatio || 1;
        var bsr = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
        var ratio = dpr / bsr;
        this.ctx.imageSmoothingEnabled = false;
        window.addEventListener('resize', () => {
            canvas.width = main.clientWidth * ratio;
            canvas.height = main.clientHeight * ratio;
            canvas.style.width = CSS.px(main.clientWidth - 8);
            canvas.style.height = CSS.px(main.clientHeight - 8);
            this.emit('resize', { x: main.clientWidth, y: main.clientHeight });
        });
        window.dispatchEvent(new UIEvent('resize'));
        // autofocus
        canvas.addEventListener('mouseover', () => canvas.focus());
        canvas.addEventListener('mouseout', () => canvas.blur());
    }
    /**
     * Zooms the canvas by the specified factor at the center point (on the canvas coordinates).
     * @param {number} factor
     * @param {Vector} [center]
     */
    zoomBy(factor, center) {
        if (!center) center = this.center;
        this.zoom *= factor;
        this.panxy = this.panxy.scale(factor).minus(center.scale(factor)).plus(center);
    }
    /**
     * Pans the canvas by the specified offset.
     * @param {Vector} xy
     */
    panBy(xy) {
        this.panxy = this.panxy.plus(xy);
    }
    /**
     * Saves the current canvas state and translates by x and y and zooms.
     */
    enter() {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.panxy.x, this.panxy.y);
    }
    /**
     * Converse of `enter()` it restores the old canvas state.
     */
    exit() {
        this.ctx.restore();
    }
    /**
     * Draws the function within an `enter()` / `exit()` pair.
     * @param {() => void} fun Draw function
     */
    drawTransformed(fun) {
        this.enter();
        fun();
        this.exit();
    }
    /**
     * Erases the canvas.
     */
    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    /**
     * Applies the current transformation to the point to yield the real X/Y.
     * @param {Vector} pt Raw point
     * @returns {Vector} Trasformed point
     */
    transformMousePoint(pt) {
        return pt.minus(this.panxy).scale(1 / this.zoom);
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get center() {
        return new Vector(this.canvas.width / 2, this.canvas.height / 2);
    }
}
