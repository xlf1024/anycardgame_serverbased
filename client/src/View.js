import {SVGNS} from "./namespaces.js";
import {SVGInteractor} from "./SVGInteractor.js";

export class View{
	#parent;
	#container;
	#mainLayer;
	#mainBg;
	#UILayer;
	#UIBg;
	#interactor;
	#controller;
	
	constructor(controller, parent){
		this.#controller = controller;
		this.#parent = parent;
		
		this.#container = document.createElement("svg");
		this.#container.setAttribute("class", "CardsContainer");
		this.#parent.appendChild(this.#container);
		
		this.#mainLayer = document.createElementNS(SVGNS, "g");
		this.#mainLayer.setAttribute("class", "mainLayer");
		this.#container.appendChild(this.#mainLayer);
		
		this.#mainBg = document.createElementNS(SVGNS,"rect");
		this.#mainBg.setAttribute("class", "mainBg");
		this.#mainLayer.appendChild(this.#mainBg);
		
		this.#UILayer = document.createElementNS(SVGNS, "g");
		this.#UILayer.setAttribute("class", "UILayer");
		this.#container.appendChild(this.#UILayer);
		
		this.#UIBg = document.createElementNS(SVGNS, "rect");
		this.#UIBg.setAttribute("class", "UIBg");
		this.#UILayer.appendChild(this.#UIBg);
		
		this.#interactor = new SVGInteractor(this.#mainLayer, #applyPosition, {"pan":true, "rotate":true, "scale":true});
		this.#interactor.scale = 1/200;
	}
	
	get mainLayer(){return #mainLayer;}
	get UILayer(){return #UILayer;}
	
	#applyPosition(position){
		let {x,y,alpha,scale} = position;
		#container.setAttribute("viewBox", `${x - 0.5/scale} ${y - 0.5/scale} ${1/scale} ${1/scale}`);
		#container.setAttribute("transform", `rotate(${alpha})`);
		mainBg.setAttribute("x", x - 0.5*zoom);
		mainBg.setAttribute("y", y - 0.5*zoom);
		mainBg.setAttribute("width", zoom);
		mainBg.setAttribute("height", zoom);
		UIBg.setAttribute("x", x - 0.5*zoom);
		UIBg.setAttribute("y", y - 0.5*zoom);
		UIBg.setAttribute("width", zoom);
		UIBg.setAttribute("height", zoom);
	}
}