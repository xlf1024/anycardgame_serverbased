import {SVGNS} from "./namespaces.js"
import coordinateTransform from "./coordinateTransform.js"
import {SVGInteractor} from "./SVGInteractor.js"
const drawAll = false;
export class Stack{
	#id;
	#cards;
	#element;
	#controller;
	#view;
	#menuContainer;
	#menuUse;
	#regularContainer;
	#menuInteractor;
	#menuOpen = false;
	
	constructor(controller, options){
		this.#id = options.stackId;
		this.#cards = options.cards;
		this.#controller = controller;
		this.#regularContainer = document.createElementNS(SVGNS, "use");
		this.#element = document.createElementNS(SVGNS, "g");
		this.#element.setAttribute("id", `stack${this.#id}`);
		this.#view = controller.view;
		this.#view.defs.appendChild(this.#element);
		this.#regularContainer.setAttribute("href",`#stack${this.#id}`);
		this.#regularContainer.addEventListener("click", this.openMenu.bind(this));
		this.#view.mainLayer.appendChild(this.#regularContainer);
		this.createMenu();
		this.update(options);
		this.move(options);
	}
	
	get id(){return this.#id;}
	
	move(options){
		this.#menuInteractor.x = options.x;
		this.#menuInteractor.y = options.y;
		this.#menuInteractor.alpha = options.alpha;
		this.toTopLayer();
	}
	
	toTopLayer(){
		//this.#regularContainer.parentNode.removeChild(this.#regularContainer);
		this.#view.mainLayer.appendChild(this.#regularContainer);
	}
	
	update(options){
		this.#cards = options.cards;
		this.redraw();
	}
	
	redraw(){
		this.#element.innerHTML = "";
		for(let i = drawAll ? this.#cards.length - 1 : 0; i>=0; i--){
			let cardDescription = this.getCard(i);
			let face = cardDescription[this.#cards[i].open ? "front" : "back"];
			let faceEL = face.forSVG();
			this.#element.appendChild(faceEL);
		}
	}
	getCard(i=0){
		let cardState = this.#cards[i];
		return this.#controller.getDeck(cardState.deck).cards[cardState.card];
	}
	
	createMenu(){
		this.#menuContainer = document.createElementNS(SVGNS, "svg");
		this.#menuContainer.setAttribute("overflow", "visible");
		this.#menuInteractor = new SVGInteractor(this.#menuContainer, this.#applyPosition.bind(this), {pan:"true", rotate:"true"}, this.sendPosition.bind(this));
		this.#menuUse = document.createElementNS(SVGNS, "use");
		this.#menuUse.setAttribute("href",`#stack${this.#id}`);
		this.#menuUse.addEventListener("click", this.closeMenu.bind(this));
	}
	
	sendPosition(){
		this.#controller.send({
			action:"moveStack",
			stackId:this.id,
			final:true,
			x:this.#menuInteractor.x,
			y:this.#menuInteractor.y,
			alpha:this.#menuInteractor.alpha
		});
	}
	
	#applyPosition(position){
		let {x,y,alpha} = position;
		[this.#menuContainer, this.#regularContainer].forEach(elem =>{
			elem.setAttribute("x", x.toString());
			elem.setAttribute("y", y.toString());
			elem.setAttribute("style", `transform-origin: ${x}px ${y}px`);
		});
		[this.#menuUse, this.#regularContainer].forEach(elem =>{
			elem.setAttribute("transform", `rotate(${alpha})`);
		});
	}
	
	openMenu(){
		this.#menuOpen = true;
		this.#menuContainer.appendChild(this.#menuUse);
		
		let t = coordinateTransform.distance.screenToSvg(this.#view.UILayer, 16, 0);
		let em = Math.hypot(t.x, t.y);
		let topCard = this.getCard(0);
		let r = 0.5*Math.hypot(topCard.width, topCard.height);
		
		let createOption = function(name, listener, positionAngle){
			let option = document.createElementNS(SVGNS, "use");
			
			option.setAttribute("href", "#option" + name)
			
			option.setAttribute("x", Math.cos(positionAngle * Math.PI / 180) * r);
			option.setAttribute("y", Math.sin(positionAngle * Math.PI / 180) * r);
			option.addEventListener("click", listener);
			
			this.#menuContainer.appendChild(option);
		}.bind(this);
		
		createOption("TakeTopCard", (evt)=>take(1,"top"), -60);
		createOption("TakeRandomCard", (evt)=>take(1,"middle"), -45);
		createOption("TakeBottomCard", (evt)=>take(1,"bottom"), -30);
		createOption("TakeTopCards", (evt)=>take(window.promt("how many?"),"top"), -15);
		createOption("TakeRandomCards", (evt)=>take(window.promt("how many?"),"middle"), -0);
		createOption("TakeBottomCards", (evt)=>take(window.promt("how many?"),"bottom"), 15);
		createOption("Shuffle", (evt)=>shuffle(), 30);
		createOption("Reverse", (evt)=>reverse(), 45);
		createOption("Flip", (evt)=>flip(), 60);
		
		this.#view.UILayer.appendChild(this.#menuContainer);
	}
	
	closeMenu(){
		this.#menuContainer.removeChild(this.#menuUse);
		this.#menuContainer.innerHTML = "";
		this.#menuContainer.parentNode.removeChild(this.#menuContainer);
		this.#menuOpen = false;
	}
	
	destroy(){
		console.log(this);
		this.#element?.parentNode?.removeChild(this.#element);
		this.#regularContainer?.parentNode?.removeChild(this.#regularContainer);
		this.#menuContainer?.parentNode?.removeChild(this.#menuContainer);
	}
}