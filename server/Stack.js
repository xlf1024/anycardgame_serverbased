import {shuffle, randInt} from "./shuffle.js"

export class Stack{
	id;
	cards;
	controller;
	x = 0;
	y = 0;
	alpha = 0;
	
	constructor(controller, cards, x=0, y=0, alpha=0){
		this.id = controller.createStackId();
		this.cards = cards;
		this.controller = controller;
		this.x = x;
		this.y = y;
		this.alpha = alpha;
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
		return new Stack(this.controller, this.cards.splice(-count, count), this.x, this.y, this.alpha);
	}
	takeTop(count = 1){
		return new Stack(this.controller, this.cards.splice(0,count), this.x, this.y, this.alpha);
	}
	takeMiddle(count = 1){
		return new Stack(this.controller, this.cards.splice(randInt(0,this.cards.length - count),count), this.x, this.y, this.alpha)
	}
	filter(criterion, value){
		let matching = [];
		let nonMatching = [];
		this.cards.forEach(card => {
			if(this.controller.getDeck(card.deck).cards[card.card].properties[criterion] === value) matching.push(card);
			else nonMatching.push(card);
		});
		this.cards = nonMatching;
		
		return new Stack(this.controller, matching, this.x, this.y, this.alpha);
	}
}