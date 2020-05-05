"use strict";
import Hammer from "@egjs/hammerjs";
import coordinateTransform from "./coordinateTransform.js";

const SVGNS = "http://www.w3.org/2000/svg";

let table = document.getElementsByClassName("table")[0];//Parcel or PostHTML seem to strip the id attribute on <svg>
let tableHammer = new Hammer(table,{
	recognizers:[
		[Hammer.Rotate, {threshold:5}],
		[Hammer.Pinch, {threshold:0.1}, [], ["rotate"]],
		[Hammer.Pan, {}, [], ["pinch", "rotate"]]
	]
});
let view = {
	x:0,
	y:0,
	zoom: 200,
	dx:0,
	dy:0,
	dzoom: 1,
	alpha:0,
	dalpha:0
}
function updateView(){
	table.setAttribute("viewBox", `${view.x + view.dx - 0.5*view.zoom*view.dzoom} ${view.y + view.dy - 0.5*view.zoom*view.dzoom} ${view.zoom*view.dzoom} ${view.zoom*view.dzoom}`);
	table.setAttribute("transform", `rotate(${view.alpha + view.dalpha})`);
}
updateView();
tableHammer.on("panmove", evt=>{
	//console.log({evt});
	let svgDeltaVec = coordinateTransform.distance.screenToSvg(table, evt.deltaX, evt.deltaY);
	view.dx = -svgDeltaVec.x;
	view.dy = -svgDeltaVec.y;
	updateView();
	//console.log({screenToSvgMatrix, screenOrigin, offset, screenDeltaVec, svgDeltaVec});
});
tableHammer.on("panend", evt=>{
	view.x += view.dx;
	view.y += view.dy;
	view.dx = 0;
	view.dy = 0;
});
tableHammer.on("pinchmove", evt=>{
	//console.log(evt);
	view.dzoom = 1/evt.scale;
	updateView();
});
tableHammer.on("pinchend", evt=>{
	view.zoom *= view.dzoom;
	view.dzoom = 1;
});
tableHammer.on("rotatemove", evt=>{
	view.dalpha = evt.rotation;
	updateView();
})
tableHammer.on("rotateend",evt=>{
	view.alpha += view.dalpha;
	view.dalpha = 0;
})
table.addEventListener("wheel",evt=>{
	
	let factor;
	switch(evt.deltaMode){
		case 0:{
			factor = 1;
			break;
		}
		case 1:{
			factor = 16;
			break;
		}
		case 2:{
			factor = window.clientHeight;
		}
	}
	
	if(evt.altKey){
		view.alpha += evt.deltaY * factor / 256;
		//console.log({evt,view,factor});
		updateView();
		evt.preventDefault();
		return;
	}
	let dx, dy, dz;
	if(evt.ctrlKey){
		[dx,dy,dz]=[evt.deltaZ,evt.deltaX,evt.deltaY];
	}else if(evt.shiftKey){
		[dx,dy,dz]=[evt.deltaY,evt.deltaZ,evt.deltaX];
	}else{
		[dx,dy,dz]=[evt.deltaX,evt.deltaY,evt.deltaZ];
	}
	let {x,y}=coordinateTransform.distance.screenToSvg(table, dx*factor,dy*factor);
	view.x += x;
	view.y += y;
	view.zoom *= Math.exp(dz*factor/512);
	updateView();
	//console.log({evt, factor, dx, dy, dz});
	evt.preventDefault();
}, {capture:true, passive:false})



