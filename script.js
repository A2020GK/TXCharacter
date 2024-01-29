// ==== DOM Objects ====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = document.getElementById("width");
const height = document.getElementById("height");
const line_width = document.getElementById("lwidth");
const line_width_test = document.getElementById("lwidth_test");
const line_width_value = document.getElementById("lwidth_value");
const stroke_color = document.getElementById("color");
const fill_color = document.getElementById("fill_color");
const color_sync = document.getElementById("color_sync");
const fill_color_tr = document.getElementById("fill_color_tr");
const tool = document.getElementById("tool");
const character_name = document.getElementById("name");
const output_code = document.getElementById("output");
const prototype_code = document.getElementById("prototype");
const save_btn = document.getElementById("save_btn");
const load_f = document.getElementById("load");

// Function to add 1 event listener at multiple objects
const multipleEventListener = (elements, event, listener) => elements.forEach(element => element.addEventListener(event, listener));

// Width and height change handler
multipleEventListener([width, height], "input", function (event) {
    canvas.width = width.value;
    canvas.height = height.value;
    render();
});

// Line width handler
line_width.addEventListener("input", function (event) {
    // This keeps line width in exact range
    if (line_width.value > 20) line_width.value = 20;
    else if (line_width.value < 1) line_width.value = 1;

    line_width_value.innerHTML = line_width.value;

    // CSS Styles
    line_width_test.style.width = `${line_width.value}px`;
    line_width_test.style.height = `${line_width.value}px`;
    line_width_test.style.backgroundColor = stroke_color.value;
});

// LW test color handler
stroke_color.addEventListener("input", function (event) {
    line_width_test.style.backgroundColor = stroke_color.value;
});

// Color sync handler
multipleEventListener([stroke_color, fill_color], "input", function (event) {
    if (color_sync.checked) {
        stroke_color.value = this.value;
        fill_color.value = this.value;
    }
});

// Color sync checkbox handler
// Logic: stroke -> fill
color_sync.addEventListener("change", function (event) {
    if (this.checked) {
        fill_color.value = stroke_color.value;
        fill_color_tr.checked = false;
        fill_color.disabled = true;
        fill_color_tr.disabled = true;
        fill_color_tr.checked = false;
    } else {
        fill_color.disabled = false;
        fill_color_tr.disabled = false;
    }
});

// Transparent fill color handler
fill_color_tr.addEventListener("change", function (event) {
    if (this.checked) {
        fill_color.disabled = true;
    } else {
        fill_color.disabled = false;
    }
});

// ==== App variables ====
let current_object = null;
let objects = [];
let mouse_pressed = false;
let basepoint = {
    x: canvas.width / 2,
    y: canvas.height / 2
}

// ==== Classes (Primitives, etc) ====

class Primitive {
    constructor(color, fill_color, line_width) {
        this.color = color;
        this.fill_color = fill_color;
        this.line_width = line_width;
        this.name = "<unnamed>";
        this.bx = 0;
        this.by = 0;
    }
    render(ctx) {
        ctx.lineCap = "round";
        ctx.lineWidth = this.line_width;
        ctx.strokeStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.fillStyle = this.fill_color == "transparent" ? "transparent" : `rgb(${this.fill_color.r},${this.fill_color.g},${this.fill_color.b})`;
    }
    compile() {
        let c = `    // ${this.name} (Object <${this.constructor.name}>)\r\n`;
        c += `    txSetColor(RGB(${this.color.r}, ${this.color.g}, ${this.color.b}), ${this.line_width});\r\n`;
        c += `    txSetFillColor(${this.fill_color == "transparent" ? "TX_TRANSPARENT" : `RGB(${this.fill_color.r}, ${this.fill_color.g}, ${this.fill_color.b})`});\r\n`;

        return c;
    }
}

class Line extends Primitive {
    constructor(xb, yb, color, fill_color, line_width) {
        super(color, fill_color, line_width);

        this.xb = xb;
        this.yb = yb;

        this.xe = xb;
        this.yb = yb;
    }
    move(xof, yof) {
        this.xb += xof;
        this.yb += yof;
        this.xe += xof;
        this.ye += yof;
    }
    render(ctx) {
        super.render(ctx);
        ctx.beginPath();
        ctx.moveTo(this.xb, this.yb);
        ctx.lineTo(this.xe, this.ye);
        ctx.stroke();
    }
    compile() {
        let c = super.compile();

        c += `    txLine(`
        c += `${compile_rel_x(this.xb)}, `;
        c += `${compile_rel_y(this.yb)}, `;
        c += `${compile_rel_x(this.xe)}, `
        c += `${compile_rel_y(this.ye)});\r\n`;

        return c;
    }
}

class Rectangle extends Primitive {
    constructor(xb, yb, color, fill_color, line_width) {
        super(color, fill_color, line_width);

        this.xb = xb;
        this.yb = yb;

        this.xe = xb;
        this.yb = yb;
    }
    render(ctx) {
        super.render(ctx);
        ctx.strokeRect(this.xb, this.yb, this.xe - this.xb, this.ye - this.yb);
        ctx.fillRect(this.xb, this.yb, this.xe - this.xb, this.ye - this.yb);
    }
    compile() {
        let c = super.compile();

        c += `    txRectangle(`;
        c += `${compile_rel_x(this.xb)}, `;
        c += `${compile_rel_y(this.yb)}, `;
        c += `${compile_rel_x(this.xe)}, `;
        c += `${compile_rel_y(this.ye)});\r\n`;

        return c;
    }
    move(xof, yof) {
        this.xb += xof;
        this.yb += yof;
        this.xe += xof;
        this.ye += yof;
    }
}

class Circle extends Primitive {
    constructor(x, y, color, fill_color, line_width) {
        super(color, fill_color, line_width);

        this.x = x;
        this.y = y;
        this.radius = 0;
    }
    render(ctx) {
        super.render(ctx);

        ctx.beginPath();

        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
    compile() {
        let c = super.compile();
        c += `    txCircle(${compile_rel_x(this.x)}, ${compile_rel_y(this.y)}, ${compile_rel_num(this.radius)});\r\n`;

        return c;
    }
    move(xof, yof) {
        this.x += xof;
        this.y += yof;
    }
}

// ==== App code ====

canvas.addEventListener("mousedown", event => mouse_pressed = true);
canvas.addEventListener("mouseup", event => mouse_pressed = false);

function relativeCords(mouseEvent) {
    let rect = mouseEvent.target.getBoundingClientRect();
    let x = mouseEvent.clientX - rect.left;
    let y = mouseEvent.clientY - rect.top;
    return { x: Math.floor(x), y: Math.floor(y) };
}


function binaryEncode(string) {
    const codeUnits = new Uint16Array(string.length);
    for (let i = 0; i < codeUnits.length; i++) {
        codeUnits[i] = string.charCodeAt(i);
    }
    return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
}

function binaryDecode(encoded) {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

function exportData() {
    let data = {
        basepoint: basepoint,
        objects: [],
        name: character_name.value,
        width: canvas.width,
        height: canvas.height
    }

    objects.forEach(element => {
        data.objects.push({
            type: element.constructor.name,
            properties: element
        })
    });
    return binaryEncode(JSON.stringify(data));
}

function downloadFile(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function importData(dt) {
    let data = JSON.parse(binaryDecode(dt));
    basepoint = data.basepoint;

    objects = [];
    data.objects.forEach(element => {
        let obj = eval(`new ${element.type}()`);
        for (let key in element.properties) {
            obj[key] = element.properties[key];
        }
        objects.push(obj);
    });

    character_name.value = data.name;
    canvas.width = data.width;
    canvas.height = data.height;

    width.value = canvas.width;
    height.value = canvas.height;

    render();
    compile_element();
}

function compile_rel_x(x) {
    if (x > basepoint.x) return `x + ${compile_rel_num(x - basepoint.x)} * orrientationCof`;
    else if (x == basepoint.x) return "x";
    else if (x < basepoint.x) return `x - ${compile_rel_num(basepoint.x - x)} * orrientationCof`;
}
function compile_rel_y(y) {
    if (y > basepoint.y) return `y + ${compile_rel_num(y - basepoint.y)}`;
    else if (y == basepoint.y) return "y";
    else if (y < basepoint.y) return `y - ${compile_rel_num(basepoint.y - y)}`;
}

function compile_rel_num(number) {
    return `${number} * scale`;
}


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(192, 192, 192, 0.6)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(basepoint.x, 0);
    ctx.lineTo(basepoint.x, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, basepoint.y);
    ctx.lineTo(canvas.width, basepoint.y);
    ctx.stroke();

    objects.forEach(element => element.render(ctx));
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getStrokeColor() {
    return hexToRgb(stroke_color.value);
}

function getFillColor() {
    if (fill_color_tr.checked) return "transparent";
    return hexToRgb(fill_color.value);
}

function compile() {
    if (character_name.value == "") return ["Error: No character name", "Error: No character name"];
    let c = "/**\r\n * Autogenerated by TXCharacter.\r\n * \r\n * https://github.com/A2020GK/TXCharacter\r\n*/\r\n";

    c += `void character_${character_name.value}(double x, double y, double scale, bool orrientation) {\r\n`;
    c += `    int orrientationCof = orrientation ? 1: -1;\r\n\r\n`;

    objects.forEach(element => c += element.compile() + "\r\n");

    c += "}\r\n";

    let cp = `void character_${character_name.value}(double x, double y, double scale, bool orrientation);`;

    return [c, cp];
}

function getDistance(x1, y1, x2, y2) {
    var xDiff = x2 - x1;
    var yDiff = y2 - y1;

    return Math.floor(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
}

function compile_element() {
    let comp = compile();
    output_code.value = comp[0];
    prototype_code.value = comp[1];
}

const move = (x, y) => objects.forEach(element => element.move(x, y));

canvas.addEventListener("mousemove", function (event) {
    const cords = relativeCords(event);
    if (mouse_pressed) {
        if (tool.value == "basepoint") {
            basepoint = cords;
        } else if (tool.value == "move") {
            move(event.movementX, event.movementY);
        }
        if (current_object == null) {
            if (tool.value == "line") current_object = new Line(
                cords.x,
                cords.y,
                getStrokeColor(),
                getFillColor(),
                line_width.value
            ); else if (tool.value == "rectangle") current_object = new Rectangle(
                cords.x,
                cords.y,
                getStrokeColor(),
                getFillColor(),
                line_width.value
            ); else if (tool.value == "circle") current_object = new Circle(
                cords.x,
                cords.y,
                getStrokeColor(),
                getFillColor(),
                line_width.value
            );


            if (current_object != null) objects.push(current_object);
        } else {
            if (current_object instanceof Line) {
                current_object.xe = cords.x;
                current_object.ye = cords.y;
            } else if (current_object instanceof Rectangle) {
                current_object.xe = cords.x;
                current_object.ye = cords.y;
            } else if (current_object instanceof Circle) {
                current_object.radius = getDistance(current_object.x, current_object.y, cords.x, cords.y);
            }
        }
    } else {
        if (current_object != null) {
            let name = prompt("Enter this primitive name: ");
            if (!(name == "" || name == null)) current_object.name = name;
            current_object = null;
        }
    }
    render();
    compile_element();
});
character_name.addEventListener("input", compile_element);

document.addEventListener("keypress", function (event) {
    const code = event.code;

    if (code == "KeyZ") {
        objects.pop();
        current_object = null;
    }
    render();
    compile_element();
})

canvas.addEventListener("click", function (event) {
    const cords = relativeCords(event);
    if (tool.value == "basepoint") {
        basepoint = cords;
        render();
        compile();
    }
});


save_btn.addEventListener("click", function (event) {
    downloadFile(`character_${character_name.value}.txc`, exportData());
});

load_f.addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, "utf-8");
    reader.addEventListener("load", function (event) {
        importData(event.target.result);
    });
    reader.addEventListener("error", function (event) {
        alert("Что-то пошло не так...");
    });
});

render();
