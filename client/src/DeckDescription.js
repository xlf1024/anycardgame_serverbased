import {CardInstance} from "./CardInstance.js"
import {CardStack} from "./CardStack.js"

export class DeckDescription{
	#cards = [];
	
	constructor(cards){
		this.#cards = cards;
	}
	get cards(){
		return this.#cards;
	}
	
	createStack(){
		let cardInstances = [];
		this.#cards.forEach(card => {
			for(let i = 0; i<card.count; i++){
				cardInstances.push(new CardInstance(card));
			}
		});
		return new CardStack(cardInstances);
	}
}