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
	#onmoveend;
	
	constructor(element, callback, options, onmoveend){
		this.#element = element;
		this.#callback = callback;
		this.#options = options;
		this.#onmoveend = onmoveend || (()=>{});
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
			recognizers.push([Hammer.Pan, {}, [], requireFailure]);
		}
		this.#hammer = new Hammer(element,{recognizers});
		
		if(options.pan){
			this.#hammer.on("panmove",this.onpanmove.bind(this));
			this.#hammer.on("panend",this.onpanend.bind(this));
		}
		if(options.rotate){
			this.#hammer.on("rotatemove",this.onrotatemove.bind(this));
			this.#hammer.on("rotateend",this.onrotateend.bind(this));
		}
		if(options.scale){
			this.#hammer.on("pinchmove",this.onpinchmove.bind(this));
			this.#hammer.on("pinchend",this.onpinchend.bind(this));
		}
		
		this.#element.addEventListener("wheel", this.onwheel.bind(this), {capture:true, passive:false});
	}
	
	apply(){
		this.#callback({
			x: this.#x + this.#dx,
			y: this.#y + this.#dy,
			alpha: this.#alpha + this.#dalpha,
			scale: this.#scale * this.#dscale
		});
	}
	
	get x(){return this.#x;}
	set x(x){this.#x = x; this.apply();}
	get y(){return this.#y;}
	set y(y){this.#y = y; this.apply();}
	get alpha(){return this.#alpha;}
	set alpha(alpha){this.#alpha = alpha; this.apply();}
	get scale(){return this.#scale;}
	set scale(scale){this.#scale = scale; this.apply();}
	
	onpanmove(evt){
		let svgDeltaVec = coordinateTransform.distance.screenToSvg(this.#element, evt.deltaX, evt.deltaY);
		this.#dx = svgDeltaVec.x;
		this.#dy = svgDeltaVec.y;
		this.apply();
	}
	
	onpanend(evt){
		this.#x += this.#dx;
		this.#y += this.#dy;
		this.#dx = 0;
		this.#dy = 0;
		this.#onmoveend();
	}
	
	onpinchmove(evt){
		this.#dscale = evt.scale;
		this.apply();
	}
	
	onpinchend(evt){
		this.#scale *= this.#dscale;
		this.#dscale = 1;
		this.#onmoveend();
	}
	
	onrotatemove(evt){
		this.#dalpha = evt.rotation;
		this.apply();
	}
	
	onrotateend(evt){
		this.#alpha += this.#dalpha;
		this.#dalpha = 0;
		this.#onmoveend();
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
			this.#alpha += evt.deltaY * factor / 8;
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
		let {x,y}=coordinateTransform.distance.screenToSvg(this.#element, dx*factor,dy*factor);
		if(this.#options.pan) this.#x += x;
		if(this.#options.pan) this.#y += y;
		if(this.#options.scale)this.#scale /= Math.exp(dz*factor/512);
		this.apply();
		//console.log({evt, factor, dx, dy, dz});
		evt.preventDefault();
		this.#onmoveend();
	}
}