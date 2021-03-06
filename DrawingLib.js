var a = 0;
var v = 0;
var d = 50;

var t = 0;

var backgroundColor;

function Init() {
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context = canvas.getContext("2d");

}


document.addEventListener("keydown", e => {
    keysDown[e.key] = true;
})

document.addEventListener("keyup", e => {
    keysDown[e.key] = false;
})

document.addEventListener("wheel", e => {

})

document.addEventListener("mousedown", e => {

})

document.addEventListener("mouseup", e => {
    scalingX = false;
    scalingY = false;
})

document.addEventListener("mousemove", e => {

})





var canvas;
var context;

/* Settings */
var WIREFRAME_MODE = false;
var DEFAULT_FONT_SIZE = 16;
var DEFAULT_FONT_FAMILY = 'serif';
/* --- */

/* State */
var scaleX = 1;
var scaleY = 1;
var scalingX = false;
var scalingY = false;
var keysDown = [];
var keysPressed = [];

/* --- */



class matrix2x2 {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
}

class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    multiply(matrix) {
        if (matrix instanceof matrix2x2) {
            var res = new vec2;
            res.x = matrix.x1 * this.x + matrix.y1 * this.y;
            res.y = matrix.x2 * this.x + matrix.y2 * this.y;
            return res;
        }

        if (matrix instanceof Matrix3x3)//temporary
        {
            var res = new vec3(this.x, this.y, 0);
            res = res.multiply(matrix);
            return (new vec2(res.x, res.y));
        }
    }

    rotate(rad) {
        return multiply(new matrix2x2(Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)));
    }

    normalize() {
        let l = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        return new vec2(this.x / l, this.y / l);
    }

    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    sub(vec) {
        return new vec2(this.x - vec.x, this.y - vec.y);
    }

    add(vec) {
        return new vec2(this.x + vec.x, this.y + vec.y);
    }

    scale(k) {
        return new vec2(this.x * k, this.y * k);
    }
}


/* General utilities */
const ClearFloat = x => Math.round(x * 1e9) / 1e9

const MinWindowDimension = () => (window.innerWidth < window.innerHeight) ? window.innerWidth : window.innerHeight;
const MaxWindowDimension = () => (window.innerWidth > window.innerHeight) ? window.innerWidth : window.innerHeight;

const ToWindowSpace = vec => (vec instanceof vec2) && new vec2((vec.x + 1) / 2 * window.innerWidth, (1 - vec.y) / 2 * window.innerHeight);
const ToWorldSpace = vec => (vec instanceof vec2) && new vec2(vec.x / window.innerWidth * 2 - 1, 1 - vec.y / window.innerHeight * 2);
/* --- */

/* Rendering utilities */
function Clear() {
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function SetColor(color) {
    if (color !== undefined) {
        context.strokeStyle = color;
        context.fillStyle = color;
    }
}

function DrawText(text, pos, options) {

    let maxWidth = undefined;

    context.font = DEFAULT_FONT_SIZE.toString().concat("px ").concat(DEFAULT_FONT_FAMILY);

    if (options instanceof Object) {
        let font = "";

        function add(data) {
            if (font.length)
                font = font.concat(' ');

            font = font.concat(data);

        }

        if (options.fontSize) {
            add(parseInt(options.fontSize).toString().concat("px"));
        }

        if (options.fontFamily) {
            add(options.fontFamily);
        }

        context.font = font;

        SetColor(options.color);

        if (options.maxWidth) {
            maxWidth = options.maxWidth
        }
    }

    pos = ToWindowSpace(pos);

    if (WIREFRAME_MODE)
        context.strokeText(text, pos.x, pos.y, 1000)
    else
        context.fillText(text, pos.x, pos.y, maxWidth)
}

function DrawLine(start, end, color) {
    SetColor(color);
    start = ToWindowSpace(start);
    end = ToWindowSpace(end);

    context.beginPath();
    context.lineWidth = 1;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

function DrawDot(pos, size, color) {
    SetColor(color);

    pos = ToWindowSpace(pos);

    context.beginPath();
    context.arc(pos.x, pos.y, size, 0, 2 * Math.PI)
    context.fill();
}

function DrawTriangle(vert1, vert2, vert3, color) {
    SetColor(color);

    vert1 = ToWindowSpace(vert1);
    vert2 = ToWindowSpace(vert2);
    vert3 = ToWindowSpace(vert3);

    context.beginPath();
    context.lineWidth = 2;
    context.moveTo(vert1.x, vert1.y);
    context.lineTo(vert2.x, vert2.y);
    context.lineTo(vert3.x, vert3.y);
    if (WIREFRAME_MODE)
        context.stroke();
    else
        context.fill();
    context.closePath();
}
/* --- */

/* Meshes and groups renderers */
function DrawTriangles(vertices) {
    for (let v = 2; v < vertices.length; v += 3) {
        Triangle(vertices[v - 2], vertices[v - 1], vertices[v]);
    }
}

function DrawLines(vertices, color) {
    for (let v = 1; v < vertices.length; v += 2) {
        DrawLine(vertices[v - 1], vertices[v], color);
    }
}

function DrawCurve(vertices, color) {
    for (let v = 1; v < vertices.length; v++) {
        DrawLine(vertices[v - 1], vertices[v], color);
    }
}

function DrawBezierCurve(points, curveSubdivision, color) {
    let helpers = [];
    let point = points[0];

    for (let i = 0; i < points.length - 1; i++) {
        helpers.push(points.slice(0, i ? -i : undefined));
    }

    console.log(helpers);

    // for (let i = 0; i < points.length - 2; i++) {
    //     helpers.push([]);
    //     let group = helpers[helpers.length - 1];
    //     for (let h = 0; h < points.length - i - 1; h++) {
    //         group.push(new vec2)
    //     }
    // }

    for (let v = 0; v < curveSubdivision; v++) {

        for (let h = 1; h < helpers.length; h++) {
            for (let hp = 0; hp < helpers[h].length; hp++) {
                helpers[h][hp] = helpers[h - 1][hp];

                let dif = helpers[h - 1][hp + 1].sub(helpers[h - 1][hp]);
                let dPos = dif.scale(v / curveSubdivision);
                helpers[h][hp] = helpers[h][hp].add(dPos);

                //DrawLine(...helpers[helpers.length - 1], "#ffffff");
                //DrawDot(helpers[helpers.length - 1][0], 2);
                console.log(...helpers[helpers.length - 1]);

                //h === helpers.length - 1 && console.log(dif);
            }
        }

        let dif = helpers[helpers.length - 1][1].sub(helpers[helpers.length - 1][0]);
        let hPos = helpers[helpers.length - 1][0];
        let sPos = hPos.add(dif.scale((v - 4) / curveSubdivision)); // WHY -4 ???
        let nPos = hPos.add(dif.scale(v / curveSubdivision));
        //console.log(helpers[helpers.length - 1]);

        DrawLine(sPos, nPos, color);
    }

    //DrawLine(...helpers[helpers.length - 1], "#ffffff");
    //DrawDot(point, 10);
}

function DrawTexts(texts) {
    for (let text of texts) {
        DrawText(...text);
    }
}
/* --- */

function RunLoop(OnUpdate, OnStop) {

    if (OnUpdate()) {
        requestAnimationFrame(RunLoop.bind(null, OnUpdate, undefined));
    }
    else {
        if (OnStop)
            OnStop();
    }
}


export {
    vec2, matrix2x2,
    Init, RunLoop,
    Clear,
    SetColor,
    DrawLine, DrawTriangle, DrawDot, DrawText,
    DrawLines, DrawCurve, DrawBezierCurve, DrawTriangles, DrawTexts
}