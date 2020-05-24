import {SVGNS} from "./namespaces.js"
import {coordinateTransform} from "./coordinateTransform.js"
import [SVGInteractor] from "./SVGInteractor.js"
const drawAll = true;
export class Stack{
	#id;
	#cards;
	#element;
	#controller;
	#view;
	#menuContainer;
	#regularContainer;
	#menuInteractor;
	#menuOpen = false;
	
	constructor(controller, options){
		this.#id = options.id;
		this.#cards = options.cards;
		this.#controller = controller;
		this.#regularContainer = document.createElementNS(SVGNS, "g");
		this.#element = document.createElementNS(SVGNS, "g");
		this.#view = controller.view;
		this.#regularContainer.appendChild(this.#element);
		this.#view.mainLayer.appendChild(this.#regularContainer);
		this.update(options);
		this.move(options);
	}
	
	move(options){
		this.#menuInteractor.x = options.x;
		this.#menuInteractor.y = options.y;
		this.#menuInteractor.alpha = options.alpha;
		toTopLayer();
	}
	
	toTopLayer(){
		this.#regularContainer.parentNode.removeChild(this.#regularContainer);
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
			let face = cardDescription[cardState.open ? "front" : "back"];
			let faceEL = face.forSVG();
			this.#element.appendChild(faceEL);
		}
	}
	getCard(i=0){
		let cardState = this.#cards[i];
		return this.#container.getDeck(cardState.deck).cards[cardState.card];
	}
	
	createMenu(){
		this.#menuContainer = document.createElementNS(SVGNS, "g");
		
		this.#menuInteractor = new SVGInteractor(this.#menuContainer, this.#applyPosition, {pan:"true", rotate:"true"}, sendPosition());
	}
	
	sendPosition(){
		this.#controller.send({
			action:"moveStack",
			stackId:this.id,
			final:true,
			x:this.menuInteractor.x,
			y:this.menuInteractor.y,
			alpha:this.menuInteractor.alpha
		});
	}
	
	#applyPosition(position){
		let {x,y,alpha} = position;
		[this.#menuContainer, this.#regularContainer].forEach(container =>{
			container.setAttribute("x", x.toString());
			container.setAttribute("y", y.toString());
			container.setAttribute("transform", `rotateZ(${alpha}deg)`);
		});
	}
	
	openMenu(){
		this.#menuOpen = true;
		this.menuContainer.innerHTML = "";
		
		let t = coordinateTransform.distance.screenToSVG(#view.UILayer, 16, 0);
		let em = Math.hypot(t.x, t.y);
		let topCard = getCard(0);
		let r = Math.hypot(topCard.width, topCard.height);
		
		function createOption(name, listener, positionAngle){
			let option = document.createElementNS(SVGNS, "g");
			
			let icon = document.createElementNS(SVGNS, "circle");
			icon.setAttribute("cx", 0);
			icon.setAttribute("cy", 0);
			icon.setAttribute("rx", "1em");
			icon.setAttribute("ry", "1em");
			option.appendChild(icon);
			
			let label = document.createElementNS(SVGNS, "text");
			label.setAttribute("x", "2em");
			label.setAttribute("y", 0);
			label.innerText = name;
			option.appendChild(label);
			
			option.setAttribute("x", Math.cos(angle * Math.PI / 180) * r);
			option.setAttribute("y", Math.sin(angle * Math.PI / 180) * r);
			option.addEventListener("click", listener);
			
			this.#menuContainer.appendChild(option);
		}
		
		createOption("take top card", (evt)=>take(1,"top"), -60);
		createOption("take random card", (evt)=>take(1,"middle"), -45);
		createOption("take bottom card", (evt)=>take(1,"bottom"), -30);
		createOption("take top cards", (evt)=>take(window.promt("how many?","top"), -15);
		createOption("take random cards", (evt)=>take(window.promt("how many?","middle"), -0);
		createOption("take bottom cards", (evt)=>take(window.promt("how many?","bottom"), 15);
		createOption("shuffle", (evt)=>shuffle(), 30);
		createOption("reverse", (evt)=>reverse(), 45);
		createOption("flip", (evt)=>flip(), 60);
		
		this.#element.parentNode.removeChild(this.#element);
		this.#menuContainer.appendChild(this.#element);
		this.#view.UILayer.appendChild(this.#menuContainer);
	}
	
	closeMenu(){
		this.#element.parentNode.removeChild(this.#element);
		this.#menuContainer.innerHTML = "";
		this.#menuContainer.parentNode.removeChild(this.#element);
		this.regularContainer.appendChild(this.#element);
		this.#menuOpen = false;
	}
}