import {SVGNS, HTMLNS} from "./namespaces.js"
export class CardDescription{
	#width;
	#height;
	#front;
	#back;
	#properties;
	
	constructor(frontURL, frontType, backURL, backType, width, height, properties){
		this.#width = Number(width);
		this.#height = Number(height);
		this.#properties = Object.freeze(properties);
		this.#front = new CardFaceDescription(frontURL, frontType, this);
		this.#back = new CardFaceDescription(backURL, backType, this);
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
	#type;
	
	constructor(src, type, card){
		this.#src = src;
		this.#card = card;
		this.#type = type;
	}
	forSVG(){
		return this.#type === "image" ? this.toSVGImageElement() : this.toForeignObject();
	}
	forHTML(){
		return this.#type === "image" ? this.toHTMLImgElement() : this.toIFrame();
	}
	toSVGImageElement(){
		let imageEl = document.createElementNS(SVGNS, "image");
		imageEl.setAttribute("href", this.#src);
		imageEl.setAttribute("width", this.#card.width);
		imageEl.setAttribute("height", this.#card.height);
		return imageEl;
	}
	toHTMLImgElement(){ //untested
		let imgEl = document.createElement("img");
		imgEl.setAttribute("src", this.#src);
		imgEl.setAttribute("width", this.#card.width);
		imgEl.setAttribute("height", this.#card.height);
		return imgEl;
	}
	toForeignObject(){
		let foreignObject = document.createElementNS(SVGNS, "foreignObject");
		foreignObject.setAttribute("width", this.#card.width.toString());
		foreignObject.setAttribute("height", this.#card.height.toString());
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