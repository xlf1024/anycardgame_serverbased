import {shuffle, randInt} from "./shuffle.js"

export class Stack{
	id;
	cards;
	controller;
	x = 0;
	y = 0;
	alpha = 0;
	
	constructor(controller, cards){
		this.id = controller.createStackId();
		this.cards = cards;
		this.controller = controller;
	}
	move(x, y, alpha){
		this.x = x;
		this.y = y;
		this.alpha = alpha;
	}
	shuffle(){
		shuffle(this.cards);
	}
	reverse(){
		this.cards.reverse();
	}
	flip(){
		this.reverse();
		this.cards.forEach(card => card.open = !card.open);
	}
	merge(stack, where){
		switch(where){
			case "top": return this.mergeTop(stack);
			case "middle": return this.mergeMiddle(stack);
			case "bottom": return this.mergeBottom(stack);
		}
	}
	mergeBottom(stack){
		this.cards.push(...stack.cards);
	}
	mergeTop(stack){
		this.cards.unshift(...stack.cards);
	}
	mergeMiddle(stack){
		this.cards.splice(randInt(0,this.cards.length),0,...stack.cards);
	}
	take(count, where){
		switch(where){
			case "top": return this.takeTop(count);
			case "middle": return this.takeMiddle(count);
			case "bottom": return this.takeBottom(count);
		}
	}
	takeBottom(count = 1){
		return new Stack(this.controller, this.cards.splice(-count, count));
	}
	takeTop(count = 1){
		return new Stack(this.controller, this.cards.splice(0,count));
	}
	takeMiddle(count = 1){
		return new Stack(this.controller, this.cards.splice(randInt(0,this.cards.length - count),count))
	}
	filter(criterion, value){
		let matching = [];
		let nonMatching = [];
		this.scards.forEach(card => {
			if(controller.getDeck(card.deck).cards[card.index].properties[criterion] === value) matching.push(card);
			else nonMatching.push(card);
		});
		this.cards = nonMatching;
		
		return new Stack(controller, matching);
	}
}