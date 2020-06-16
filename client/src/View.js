import {SVGNS} from "./namespaces.js";
import {SVGInteractor} from "./SVGInteractor.js";
import coordinateTransform from "./coordinateTransform.js";

export class View{
	#container;
	#defs;
	#mainLayer;
	#mainBg;
	#UILayer;
	#UIBg;
	#interactor;
	#controller;
	#stackPreviewContainer;
	#stackPreviewInteractor;
	#notificationBox;
	
	constructor(controller, container){
		this.#controller = controller;
		this.#container = container;
		
		this.#container.setAttribute("class", "CardsContainer");
		
		this.#defs = container.querySelector("defs");
		
		this.#mainLayer = container.querySelector(".MainLayer");
		
		this.#mainBg = container.querySelector(".MainBg");
		
		this.#UILayer = container.querySelector(".UILayer");
		
		this.#UIBg = container.querySelector(".UIBg");
		
		this.#stackPreviewContainer = document.querySelector(".StackPreviewContainer");
		
		this.#notificationBox = document.querySelector(".Notifications");
		
		this.#interactor = new SVGInteractor(this.#mainLayer, this.#applyPosition.bind(this), {"pan":true, "rotate":true, "scale":true});
		this.#interactor.scale = 1;
		this.#mainBg.addEventListener("click", this.onclick.bind(this));
		
		this.#stackPreviewInteractor = new SVGInteractor(this.#stackPreviewContainer, this.scaleStackPreview.bind(this),{"pan":false, "rotate":false, "scale":true});
		this.#stackPreviewInteractor.scale = 1;
		
		this.#stackPreviewContainer.addEventListener("click", evt=>{this.#stackPreviewContainer.innerHTML = ""});
	}
	
	get defs(){return this.#defs;}
	get mainLayer(){return this.#mainLayer;}
	get UILayer(){return this.#UILayer;}
	get stackPreviewContainer(){return this.#stackPreviewContainer;}
	get notificationBox(){return this.#notificationBox;}
	
	#applyPosition(position){
		let {x,y,alpha,scale} = position;
		let svgsize = this.#container.clientWidth / scale;
		this.#container.setAttribute("viewBox", `${- x - 0.5*svgsize} ${- y - 0.5*svgsize} ${1*svgsize} ${1*svgsize}`);
		this.#container.setAttribute("transform", `rotate(${alpha})`);
		this.#mainBg.setAttribute("x", - x - 0.5*svgsize);
		this.#mainBg.setAttribute("y", - y - 0.5*svgsize);
		this.#mainBg.setAttribute("width", 1*svgsize);
		this.#mainBg.setAttribute("height", 1*svgsize);
		this.#UIBg.setAttribute("x", - x - 0.5*svgsize);
		this.#UIBg.setAttribute("y", - y - 0.5*svgsize);
		this.#UIBg.setAttribute("width", 1*svgsize);
		this.#UIBg.setAttribute("height", 1*svgsize);
		if(this.#stackPreviewInteractor)this.#stackPreviewInteractor.scale = scale;
	}
	
	onclick(evt){
		if(this.#controller.activeStackId){
			let stack = this.#controller.getStack(this.#controller.activeStackId);
			let {x,y} = coordinateTransform.point.screenToSvg(this.#container, evt.x, evt.y);
			stack.moveTo(x,y);
		}
	}
	
	scaleStackPreview(){
		let scale = this.#stackPreviewInteractor.scale;
		let pxWidth = window.innerWidth;//this.#stackPreviewContainer.clientWidth;
		let pxHeight = window.innerHeight;//this.#stackPreviewContainer.clientHeight;
		this.#stackPreviewContainer.setAttribute("viewBox", `0 0 ${pxWidth/scale} ${pxHeight/scale}`);
		this.#stackPreviewContainer.setAttribute("style", `--width: ${pxWidth/scale}px; --height: ${pxHeight/scale}px`);
	}
}