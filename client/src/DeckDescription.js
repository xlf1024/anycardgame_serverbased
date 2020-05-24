export class DeckDescription{
	#cards = [];
	#id;
	#blobs = [];
	
	constructor(id, cards, blobs){
		this.#cards = cards;
		this.#id = id;
		this.#blobs = blobs;
	}
	get cards(){
		return this.#cards;
	}
	
	get id(){
		return this.#id;
	}
	
	delete(){
		this.#blobs.forEach(URL.revokeObjectURL);
		this.#blobs = [];
		this.#cards = [];
	}
}