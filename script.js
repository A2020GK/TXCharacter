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

