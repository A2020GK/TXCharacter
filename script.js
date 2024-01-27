// ==== DOM Objects ====
const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");
const width=document.getElementById("width");
const height=document.getElementById("height");
const line_width=document.getElementById("lwidth");
const line_width_test=document.getElementById("lwidth_test");
const line_width_value=document.getElementById("lwidth_value");
const stroke_color=document.getElementById("color");
const fill_color=document.getElementById("fill_color");
const color_sync=document.getElementById("color_sync");
const fill_color_tr=document.getElementById("fill_color_tr");
const tool=document.getElementById("tool");
const character_name=document.getElementById("name");
const output_code=document.getElementById("output");

// Function to add 1 event listener at multiple objects
const multipleEventListener=(elements,event,listener)=>elements.forEach(element=>element.addEventListener(event,listener));

// Width and height change handler
multipleEventListener([width,height],"input",function(event) {
    canvas.width=width.value;
    canvas.height=height.value;
});

// Line width handler
line_width.addEventListener("input",function(event) {
    // This keeps line width in exact range
    if(line_width.value>20) line_width.value=20;
    else if(line_width.value<1) line_width.value=1;
    
    line_width_value.innerHTML=line_width.value;

    // CSS Styles
    line_width_test.style.width=`${line_width.value}px`;
    line_width_test.style.height=`${line_width.value}px`;
    line_width_test.style.backgroundColor=stroke_color.value;
});

// LW test color handler
stroke_color.addEventListener("input",function(event) {
    line_width_test.style.backgroundColor=stroke_color.value;
});

// Color sync handler
multipleEventListener([stroke_color,fill_color],"input",function(event) {
    if(color_sync.checked) {
        stroke_color.value=this.value;
        fill_color.value=this.value;
    }
});

// Color sync checkbox handler
// Logic: stroke -> fill
color_sync.addEventListener("change",function(event) {
    if(this.checked) {
        fill_color.value=stroke_color.value;
        fill_color_tr.checked=false;
        fill_color.disabled=true;
        fill_color_tr.disabled=true;
        fill_color_tr.checked=false;
    } else {
        fill_color.disabled=false;
        fill_color_tr.disabled=false;
    }
});

// Transparent fill color handler
fill_color_tr.addEventListener("change",function(event) {
    if(this.checked) {
        fill_color.disabled=true;
    } else {
        fill_color.disabled=false;
    }
});

// ==== App variables ====
let current_object=null;
let objects=[];
let mouse_pressed=false;

// ==== Classes (Primitives, etc) ====

class Primitive {
    constructor(color,fill_color,line_width) {
        this.color=color;
        this.fill_color=fill_color;
        this.line_width=line_width;
        this.name="<unknown object>";
    }
    render(ctx) {
        ctx.lineCap="round";
        ctx.lineWidth=this.line_width;
        ctx.strokeStyle=`rgb(${this.color.r},${this.color.g},${this.color.b})`;
        ctx.fillStyle=this.fill_color=="transparent"?"transparent":`rgb(${this.fill_color.r},${this.fill_color.g},${this.fill_color.b})`;
    }
    compile() {
        let c=`    // ${this.name} (Object <${this.constructor.name}>)\r\n`;
        c+=`    txSetColor(RGB(${this.color.r}, ${this.color.g}, ${this.color.b}));\r\n`;
        c+=`    txSetFillColor(${this.fill_color=="transparent"?"TX_TRANSPARENT":`RGB(${this.fill_color.r}, ${this.fill_color.g}, ${this.fill_color.b})`}, ${this.line_width})\r\n`;

        return c;
    }
}

class Line extends Primitive {
    constructor(xb,yb,color,fill_color,line_width) {
        super(color,fill_color,line_width);
        this.xb=xb;
        this.yb=yb;

        this.xe=xb;
        this.yb=yb;
    }
    render(ctx) {
        super.render(ctx);
        ctx.beginPath();
        ctx.moveTo(this.xb,this.yb);
        ctx.lineTo(this.xe,this.ye);
        ctx.stroke();
    }
    compile() {
        let c=super.compile();
        c+=`    txLine(${this.xb}, ${this.yb}, ${this.xe}, ${this.ye})\r\n`;
        return c;
    }
}

// ==== App code ====

canvas.addEventListener("mousedown",event=>mouse_pressed=true);
canvas.addEventListener("mouseup",event=>mouse_pressed=false);

function relativeCords(mouseEvent) {
    let rect = mouseEvent.target.getBoundingClientRect();
    let x = mouseEvent.clientX - rect.left;
    let y = mouseEvent.clientY - rect.top;
    return {x:Math.floor(x),y:Math.floor(y)};
}

function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    objects.forEach(element=>element.render(ctx));
}

function hexToRgb(hex) {
    if(fill_color_tr.checked) return "transparent";
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

function compile() {
    if(character_name.value=="") return "Error: No character name";
    let c=`void character_${character_name.value}() {\r\n`;

    objects.forEach(element=>c+=element.compile()+"\r\n");

    c+="}\r\n";
    return c;
}

canvas.addEventListener("mousemove",function(event) {
    const cords=relativeCords(event);
    if(mouse_pressed) {
        if(current_object==null) {
            if(tool.value=="line") current_object=new Line(
                cords.x,
                cords.y,
                hexToRgb(stroke_color.value),
                hexToRgb(fill_color.value),
                line_width.value
            );


            objects.push(current_object);
        } else {
            if(current_object instanceof Line) {
                current_object.xe=cords.x;
                current_object.ye=cords.y;
            }
        }
    } else {
        if(current_object!=null) {
            current_object.name=prompt("Enter this primitive name: ");
            current_object=null;
        }
    }
    render();
    output_code.value=compile();
});
character_name.addEventListener("input",event=>output_code.value=compile());