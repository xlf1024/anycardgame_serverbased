
export class CardInstance{
	#description;
	#open = false;
	
	constructor(description){
		this.#description = description;
	}
	flip(){
		this.#open = !this.#open;
	}
	getOpenFace(){
		return this.#open ? this.#description.front : this.#description.back;
	}
	getCoveredFace(){
		return !this.#open ? this.#description.front : this.#description.back;
	}
	get description(){
		return this.#description;
	}
	get open(){
		return this.#open;
	}
}