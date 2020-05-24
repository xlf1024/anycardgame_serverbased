import {shuffle, randInt} from "./shuffle.js"

export class CardStack{
	#cards;
	
	constructor(cards){
		this.#cards = cards;
	}
	get cards(){
		return this.#cards;
	}
	get size(){
		return this.#cards.length;
	}
	shuffle(){
		this.#cards = shuffle(this.#cards);
	}
	reverse(){
		this.#cards.reverse();
	}
	flip(){
		this.reverse();
		this.#cards.forEach(card => card.flip());
	}
	insertBottom(stack){
		this.#cards.push(...stack.cards);
	}
	insertTop(stack){
		this.#cards.unshift(...stack.cards);
	}
	insertMiddle(stack){
		this.#cards.splice(randInt(0,this.#cards.length),0,...stack.cards);
	}
	takeBottom(count = 1){
		return new CardStack(this.#cards.splice(-count, count));
	}
	takeTop(count = 1){
		return new CardStack(this.#cards.splice(0,count));
	}
	takeMiddle(count = 1){
		return new CardStack(this.#cards.splice(randInt(0,this.#cards.length - count),count))
	}
}