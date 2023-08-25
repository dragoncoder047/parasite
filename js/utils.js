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
        reportedXY = new Vector(evt.clientX, evt.clientY);
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

/**
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */

function clamp(x, a, b) {
    if (x < a) return a;
    if (x > b) return b;
    return x;
}
/**
 * Like arduino map()
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {boolean} k
 * @returns {number}
 */
function map(x, a, b, c, d, k = true) {
    if (k) x = clamp(x, a, b);
    return (x - a) * (d - c) / (b - a) + c;
}

/**
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 * @returns {number[]}
 */
function irange(start, stop, step) {
    /**
     * @type {number[]}
     */
    var out = [];
    for (var x = start; x <= stop; x += step) out.push(x);
    return x;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Vector} position
 * @param {number} radius
 * @param {string} fillColor
 * @param {string} strokeColor
 * @param {number} strokeWidth
 */
function dotAt(ctx, position, radius, fillColor, strokeColor = null, strokeWidth = null) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, false);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Vector} p1
 * @param {Vector} p2
 * @param {number} radius
 * @param {string} fillColor
 */
function fatLine(ctx, p1, p2, radius, fillColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = radius;
    ctx.lineCap = "round";
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
}

/**
 * @param {number} mu
 * @param {number} sigma
 * @returns {number}
 */
function gauss(mu, sigma) {
    // From https://stackoverflow.com/a/36481059
    return mu + sigma * Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

/**
 * @param {string} foo
 * @return {never}
 */
function todo(foo) {
    throw new Error("todo: " + foo || (arguments.callee.name + "()"));
}
