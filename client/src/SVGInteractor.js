import coordinateTransform from "./coordinateTransform.js";
import Hammer from "@egjs/hammerjs";

export class SVGInteractor{
	#callback;
	#element;
	#x=0;
	#dx=0;
	#y=0;
	#dy=0;
	#alpha=0;
	#dalpha=0;
	#scale=1;
	#dscale=1;
	#hammer;
	#options;
	
	constructor(element, callback, options, onmoveend = ()=>{} ){
		this.#element = element;
		this.#callback = callback;
		this.#options = options;
		let recognizers = [];
		if(options.rotate){
			recognizers.push([Hammer.Rotate,{threshold:5}]);
		}
		if(options.scale){
			let requireFailure = [];
			if(options.rotate) requireFailure.push("rotate");
			recognizers.push([Hammer.Pinch,{threshold:0.1},[],requireFailure]);
		}
		if(options.pan){
			let requireFailure = [];
			if(options.rotate) requireFailure.push("rotate");
			if(options.scale) requireFailure.push("pinch");
			recognizers.push([Hammer.Pan, {}, [], ["pinch", "rotate"]]);
		}
		this.#hammer = new Hammer(element,{recognizers});
		
		if(options.pan){
			#hammer.on("panmove",onpanmove);
			#hammer.on("panend",onpanend);
		}
		if(options.rotate){
			#hammer.on("roatatemove",onrotatemove);
			#hammer.on("rotateend",onrotateend);
		}
		if(options.scale){
			#hammer.on("pinchmove",onpinchmove);
			#hammer.on("pinchend",onpinchend);
		}
		
		this.#element.addEventListener("wheel", onwheel, {capture:true, passive:false});
	}
	
	apply(){
		#callback({
			x: #x + #dx;
			y: #y + #dy;
			alpha: #alpha + #dalpha;
			scale: #scale * #dscale
		});
	}
	
	get x(){return #x;}
	set x(x){#x = x; apply();}
	get y(){return #y;}
	set y(y){#y = y; apply();}
	get alpha(){return #alpha;}
	set alpha(alphy){#alpha = alpha; apply();}
	get scale(){return #scale;}
	set scale(scale){#scale = scale; apply();}
	
	onpanmove(evt){
		let svgDeltaVec = coordinateTransform.distance.screenToSvg(#element, evt.deltaX, evt.deltaY);
		#dx = -svgDeltaVec.x;
		#dy = -svgDeltaVec.y;
		apply();
	}
	
	onpanend(evt){
		#x += #dx;
		#y += #dy;
		#dx = 0;
		#dy = 0;
		onmoveend();
	}
	
	onpinchmove(evt){
		#dscale = evt.scale;
		apply();
	}
	
	onpinchend(evt){
		#scale *= #dscale;
		#dscale = 1;
		onmoveend();
	}
	
	onrotatemove(evt){
		#dalpha = evt.rotation;
		apply();
	}
	
	onrotateend(evt){
		#alpha += #dalpha;
		#dalpha = 0;
		onmoveend();
	}
	
	onwheel(evt){
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
			#alpha += evt.deltaY * factor / 8;
			//console.log({evt,view,factor});
			apply();
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
		let {x,y}=coordinateTransform.distance.screenToSvg(#element, dx*factor,dy*factor);
		if(#options.pan) #x += x;
		if(#options.pan) #y += y;
		if(#options.scale)#scale *= Math.exp(dz*factor/512);
		apply();
		//console.log({evt, factor, dx, dy, dz});
		evt.preventDefault();
		onmoveend();
	}
}