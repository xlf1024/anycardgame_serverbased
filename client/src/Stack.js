import {SVGNS} from "./namespaces.js"
import coordinateTransform from "./coordinateTransform.js"
import {SVGInteractor} from "./SVGInteractor.js"
import {v4 as uuid} from "uuid";
const drawAll = false;
export class Stack{
	#id;
	#cards;
	#element;
	#controller;
	#view;
	#menuContainer;
	#menuUse;
	#menuOptionsGroup;
	#regularContainer;
	#menuInteractor;
	#menuOpen = false;
	#active = false;
	
	constructor(controller, options){
		this.#id = options.stackId;
		this.#cards = options.cards;
		this.#controller = controller;
		this.#regularContainer = document.createElementNS(SVGNS, "use");
		this.#element = document.createElementNS(SVGNS, "g");
		this.#element.setAttribute("id", `stack${this.#id}`);
		this.#element.setAttribute("class", "stack");
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
		this.#menuOptionsGroup = document.createElementNS(SVGNS, "g");
		this.#menuContainer.appendChild(this.#menuUse);
		this.#menuContainer.appendChild(this.#menuOptionsGroup);
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
	
	activate(){
		this.#element.setAttribute("active","active");
		this.#menuUse.setAttribute("active","active");
		this.#regularContainer.setAttribute("active","active");
		this.#active = true;
	}
	
	deactivate(){
		this.#element.removeAttribute("active");
		this.#menuUse.removeAttribute("active");
		this.#regularContainer.removeAttribute("active");
		this.#active = false;
	}
	
	openMenu(evt){
		evt.preventDefault();
		if(this.#controller.activeStackId !== null)this.openDropMenu(evt);
		else this.openTakeMenu(evt);
	}
	openTakeMenu(){
		let {createOption} = this.prepareMenu();
		let countIndicator = document.createElementNS(SVGNS, "text");
		countIndicator.innerHTML = this.#cards.length;
		countIndicator.setAttribute("x", "-1");
		countIndicator.setAttribute("y", "0");
		countIndicator.setAttribute("font-size","0.2");
		this.#menuOptionsGroup.appendChild(countIndicator);
		createOption("TakeStack", (evt)=>this.takeStack());
		createOption("TakeTopCard", (evt)=>this.take(1,"top"));
		createOption("TakeRandomCard", (evt)=>this.take(1,"middle"));
		createOption("TakeBottomCard", (evt)=>this.take(1,"bottom"));
		createOption("TakeTopCards", (evt)=>this.take(window.prompt("how many?"),"top"));
		createOption("TakeRandomCards", (evt)=>this.take(window.prompt("how many?"),"middle"));
		createOption("TakeBottomCards", (evt)=>this.take(window.prompt("how many?"),"bottom"));
		createOption("Shuffle", (evt)=>this.shuffle());
		createOption("Reverse", (evt)=>this.reverse());
		createOption("Flip", (evt)=>this.flip());
		createOption("Filter", (evt)=>this.filter());
		createOption("ViewTops", (evt)=>this.view(open => open));
		createOption("ViewBottoms", (evt)=>this.view(open => !open));
		createOption("ViewFronts", (evt)=>this.view(open => true));
		createOption("ViewBacks", (evt)=>this.view(open => false));
		
	}
	prepareMenu(){
		this.#menuOpen = true;
		
		let t = coordinateTransform.distance.screenToSvg(this.#view.UILayer, 16, 0);
		let em = Math.hypot(t.x, t.y);
		let topCard = this.getCard(0);
		let r = 0.5*Math.hypot(topCard.width, topCard.height);
		
		let createOption = function(name, listener, positionAngle){
			let option = document.createElementNS(SVGNS, "use");
			
			option.setAttribute("href", "#option" + name)
			option.addEventListener("click", listener);
			
			this.#menuOptionsGroup.appendChild(option);
		}.bind(this);
		
		this.#menuOptionsGroup.setAttribute("transform", `scale(${r})`);
		this.#view.UILayer.appendChild(this.#menuContainer);
		return {createOption};
	}
	openDropMenu(openingEvt){
		let {createOption} = this.prepareMenu();
		createOption("MergeTop", (evt)=>this.merge("top"));
		createOption("MergeMiddle", (evt)=>this.merge("middle"));
		createOption("MergeBottom", (evt)=>this.merge("bottom"));
		createOption("PlaceSeparate", (evt)=>{
			this.closeMenu();
			this.#view.onclick(openingEvt)
		});
	}
	
	closeMenu(){
		this.#menuOptionsGroup.innerHTML = "";
		this.#menuContainer?.parentNode?.removeChild(this.#menuContainer);
		this.#menuOpen = false;
	}
	
	destroy(){
		console.log(this);
		if(this.#active)this.#controller.doDeactivateStack();
		this.#element?.parentNode?.removeChild(this.#element);
		this.#regularContainer?.parentNode?.removeChild(this.#regularContainer);
		this.#menuContainer?.parentNode?.removeChild(this.#menuContainer);
	}
	
	take(count, where){
		this.#controller.send({
			"action":"takeStack",
			"stackId":this.id,
			"count":count,
			"where":where
		});
	}
	
	shuffle(){
		this.#controller.send({
			"action":"shuffleStack",
			"stackId":this.id
		});
	}
	
	reverse(){
		this.#controller.send({
			"action":"reverseStack",
			"stackId":this.id
		});
	}
	
	flip(){
		this.#controller.send({
			"action":"flipStack",
			"stackId":this.id
		})
	}
	
	takeStack(){
		this.#controller.doActivateStack({stackId:this.id});
		this.closeMenu();
	}
	
	filter(){
		let criteria = this.#cards
			.map((_,i)=>Object.keys(this.getCard(i).properties))
			.flat()
			.filter((c,i,a)=>a.indexOf(c)===i);
		let criterion = window.prompt("criterion?\ne.g.: " + criteria.join(", "));
		let values = this.#cards
			.map((_,i)=>this.getCard(i).properties[criterion])
			.filter((c,i,a)=>c!==undefined&&c!==null&&a.indexOf(c)===i);
		let value = window.prompt("value?\ne.g.: " + values.join(", "));
		this.#controller.send({
			"action":"filterStack",
			"stackId":this.id,
			"criterion":criterion,
			"value":value
		})
	}
	
	merge(where){
		this.#controller.send({
			"action":"mergeStack",
			"where":where,
			"movingStack":this.#controller.activeStackId,
			"stayingStack":this.id
		})
		this.closeMenu();
	}
	
	moveTo(x,y){
		this.#menuInteractor.x = x;
		this.#menuInteractor.y = y;
		this.sendPosition();
		this.#controller.doDeactivateStack();
	}
	
	view(faceDecider){
		let stackPreviewFlow = document.createElementNS(SVGNS, "foreignObject");
		for(let i = 0; i < this.#cards.length; i++){
			let cardDescription = this.getCard(i);
			let face = cardDescription[faceDecider(this.#cards[i].open) ? "front" : "back"];
			let faceEL = face.forSVG();
			
			let cardContainer = document.createElementNS(SVGNS, "svg");
			
			
			faceEL.setAttribute("x",0.5 * cardDescription.width);
			faceEL.setAttribute("y",0.5 * cardDescription.height);
			cardContainer.setAttribute("viewBox", `0 0 ${cardDescription.width} ${cardDescription.height}`);
			cardContainer.setAttribute("style", `--width:${cardDescription.width}px; --height:${cardDescription.height}px`);
			
			cardContainer.appendChild(faceEL);
			stackPreviewFlow.appendChild(cardContainer)
		}
		this.#view.stackPreviewContainer.appendChild(stackPreviewFlow);
		this.#view.scaleStackPreview();
	}
}