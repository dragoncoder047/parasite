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
        reportedXY = vScale([].map.call(evt.touches, t => ({ x: t.clientX, y: t.clientY })).reduce(vPlus), 1 / evt.touches.length);
    }
    else {
        reportedXY = { x: evt.clientX, y: evt.clientY };
    }
    return {
        x: (reportedXY.x - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (reportedXY.y - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
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
        this.panxy = { x: 0, y: 0 };
        /**
         * @type {Vector}
         */
        this.downxy = { x: 0, y: 0 };
        /**
         * @type {Vector}
         */
        this.lastxy = { x: 0, y: 0 };
        canvas.addEventListener('mousedown', e => {
            this.mouseDown = true;
            this.timeDown = +new Date();
            this.downxy = getMousePos(canvas, e);
            this.lastxy = vClone(this.downxy);
            this.emit('mousedown', this.downxy);
        });
        canvas.addEventListener('touchstart', e => {
            this.mouseDown = true;
            this.timeDown = +new Date();
            this.downxy = getMousePos(canvas, e);
            this.lastxy = vClone(this.downxy);
            this.emit('mousedown', this.downxy);
        });
        canvas.addEventListener('mouseup', e => {
            this.mouseDown = false;
            this.emit('mouseup', this.lastxy);
            if (vRelMag(this.lastxy, this.downxy) < 16 && +new Date() - this.timeDown < 250) this.emit('click', this.downxy);
        });
        canvas.addEventListener('touchend', e => {
            this.mouseDown = false;
            this.emit(e, 'mouseup', this.lastxy);
            if (vRelMag(this.lastxy, this.downxy) < 16 && +new Date() - this.timeDown < 250) this.emit('click', this.downxy);
        });
        canvas.addEventListener('touchmove', e => {
            var xy = getMousePos(canvas, e);
            if (!this.mouseDown) {
                this.mouseDown = true;
                this.downxy = vClone(xy);
                this.emit('mousedown', this.downxy);
            } else {
                this.emit('drag', vMinus(xy, this.lastxy));
            }
            this.lastxy = vClone(xy);
        });
        canvas.addEventListener('mousemove', e => {
            var xy = getMousePos(canvas, e);
            if (!this.mouseDown) {
                this.emit('mouseover', xy);
            }
            else {
                this.emit('drag', vMinus(xy, this.lastxy));
            }
            this.lastxy = vClone(xy);
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
        if (!center) center = vScale({ x: this.canvas.width, y: this.canvas.height }, 0.5);
        this.zoom *= factor;
        this.panxy = vPlus(vMinus(vScale(this.panxy, factor), vScale(center, factor)), center);
    }
    /**
     * Pans the canvas by the specified offset.
     * @param {Vector} xy
     */
    panBy(xy) {
        this.panxy = vPlus(this.panxy, xy);
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
        return vScale(vMinus(pt, this.panxy), 1 / this.zoom);
    }
    /**
     * @type {Vector}
     * @readonly
     */
    get center() {
        return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    }
}
