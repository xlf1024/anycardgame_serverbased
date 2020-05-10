import {SVGNS, HTMLNS} from "./namespaces.js"
export class CardDescription{
	#width;
	#height;
	#front;
	#back;
	
	constructor(front, back, width, height){
		this.#width = width;
		this.#height = height;
		this.#front = new CardFaceDescription(front, this);
		this.#back = new CardFaceDescription(back, this);
	}
	get width(){
		return this.#width;
	}
	get height(){
		return this.#height;
	}
	get front(){
		return this.#front;
	}
	get back(){
		return this.#back;
	}
}

class CardFaceDescription{
	#src;
	#card;
	
	constructor(src, card){
		this.#src = src;
		this.#card = card;
	}
	toSVGImageElement(){
		let imageEl = document.createElementNS(SVGNS, "image");
		imageEl.setAttribute("href", this.#src);
		imageEl.setAttribute("width", this.#card.width);
		imageEl.setAttribute("height", this.#card.height);
		return imageEl;
	}
	
	toForeignObject(){
		let foreignObject = document.createElementNS(SVGNS, "foreignObject");
		foreignObject.setAttribute("width", this.#card.width);
		foreignObject.setAttribute("height", this.#card.height);
		foreignObject.appendChild(this.toIFrame());
		return foreignObject;
	}
	toIFrame(){
		let iframe = document.createElementNS(HTMLNS, "iframe");
		iframe.setAttribute("width", this.#card.width);
		iframe.setAttribute("height", this.#card.height);
		iframe.setAttribute("src", this.#src);
		iframe.setAttribute("referrerpolicy", "no-referrer")
		iframe.setAttribute("sandbox", "");
		iframe.setAttribute("csp", "default-src blob: data:")
		iframe.style.pointerEvents="none";
		iframe.style.border="none";
		return iframe;
	}
}