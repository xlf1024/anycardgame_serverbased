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
	width: 200,
	height: 200,
	dx:0,
	dy:0,
	dzoom: 1,
	alpha:0,
	dalpha:0
}
function updateView(){
	table.setAttribute("viewBox", `${view.x + view.dx - 0.5*view.width*view.dzoom} ${view.y + view.dy - 0.5*view.height*view.dzoom} ${view.width*view.dzoom} ${view.height*view.dzoom}`);
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
	view.width *= view.dzoom;
	view.height *= view.dzoom;
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