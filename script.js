const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");
const width=document.getElementById("width");
const height=document.getElementById("height");
const line_width=document.getElementById("lwidth");
const line_width_test=document.getElementById("lwidth_test");
const line_width_value=document.getElementById("lwidth_value");
const stroke_color=document.getElementById("color");
const fill_color=document.getElementById("fill_color");

const multipleEventListener=(elements,event,listener)=>elements.forEach(element=>element.addEventListener(event,listener));

multipleEventListener([width,height],"input",function(event) {
    canvas.width=width.value;
    canvas.height=height.value;
});

line_width.addEventListener("input",function(event) {
    if(line_width.value>20) line_width.value=20;
    else if(line_width.value<1) line_width.value=1;
    line_width_value.innerHTML=line_width.value;
    line_width_test.style.width=`${line_width.value}px`;
    line_width_test.style.height=`${line_width.value}px`;
    line_width_test.style.backgroundColor=stroke_color.value;
});
stroke_color.addEventListener("input",function(event) {
    line_width_test.style.backgroundColor=stroke_color.value;
})
