import {Stack} from "./Stack.js";
export class Deck{
	cards = [];
	id;
	controller;
	file;
	
	constructor(controller, cards, file){
		this.id = controller.createDeckId();
		this.cards = cards;
		this.controller = controller;
		this.file = file;
	}
	
	createStack(){
		let cardDescriptions = [];
		this.cards.forEach((card, index) =>{
			for(let i = 0; i<card.count; i++){
				cardDescriptions.push({
					deck: this.id,
					card: index,
					open: false
				});
			}
		});
		return new Stack(this.controller, cardDescriptions);
	}
}