import {SVGNS, HTMLNS} from "./namespaces.js"
export class CardDescription{
	#width;
	#height;
	#front;
	#back;
	#properties;
	
	constructor(frontURL, backURL, width, height, properties){
		this.#width = Number(width);
		this.#height = Number(height);
		this.#properties = Object.freeze(properties);
		this.#front = new CardFaceDescription(frontURL, this);
		this.#back = new CardFaceDescription(backURL, this);
		console.log(this);
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
	get properties(){
		return this.#properties;
	}
}
class CardFaceDescription{
	#src;
	#card;
	
	constructor(src, card){
		this.#src = src;
		this.#card = card;
	}
	forSVG(){
		return this.toSVGImageElement();
	}
	forHTML(){
		return this.toHTMLImgElement();
	}
	toSVGImageElement(){
		let imageEl = document.createElementNS(SVGNS, "image");
		imageEl.setAttribute("href", this.#src);
		imageEl.setAttribute("width", this.#card.width.toString());
		imageEl.setAttribute("height", this.#card.height.toString());
		imageEl.setAttribute("x", (-0.5*this.#card.width).toString());
		imageEl.setAttribute("y", (-0.5*this.#card.height).toString());
		return imageEl;
	}
	toHTMLImgElement(){ //untested
		let imgEl = document.createElement("img");
		imgEl.setAttribute("src", this.#src);
		imgEl.setAttribute("width", this.#card.width);
		imgEl.setAttribute("height", this.#card.height);
		return imgEl;
	}
}