import {loadDeckFromZip} from "./loadDeck.js"
import {Stack} from "./Stack.js"
import {View} from "./View.js"

export class Controller{
	lastMId = 0;
	ws;
	decks = [];
	stacks = [];
	activeStackId = null;
	inQueue = [];
	outQueue = [];
	inBlockLevel = 0;
	outBlockLevel = 1;
	view;
	
	constructor(serverURL, DOMContainer){
		ws = new WebSocket(serverURL);
		ws.binaryType = "blob";
		ws.onopen = this.onopen;
		ws.onmessage = this.onmessage;
		view = new View(this, DOMContainer);
	}
	
	onopen(){
		this.outBlockLevel--;
	}
	
	onmessage(evt){
		inQueue.push(JSON.parse(evt.data));
		handleMessages();
	}
	handleMessages(){
		while(inQueue.length > 0 && inBlockLevel == 0){
			handleMessage();
		}
	}
	handleMessage(){
		let message = inQueue.unshift();
		if(message.action === "resync"){
			lastMId = message.mId;
			doResync(message);
			return;
		}
		if(message.mId > lastMId + 1){
			sendMessage({
				"action":"resync"
			});
			return;
		}
		if(message.mId < lastMId){
			return;
		}
		lastMId = message.mId;
		switch(message.action){
			case "loadDeck":{
				doLoadDeck(message);
				break;
			}
			case "updateStack":{
				doUpdateStack(message);
				break;
			}
			case "moveStack":{
				doMoveStack(message);
				break;
			}
			case "createStack":{
				doCreateStack(message);
				break;
			}
			case "deleteStack":{
				doDeleteStack(message);
				break;
			}
			default:{
				alert("unknown message");
				console.error(message);
			}
		}
	}
	
	async doResync(message){
		inBlockLevel++;
		this.stacks.splice().forEach(stack => this.doDeleteStack(stack.id));
		this.decks.splice().forEach(deck => this.doDeleteDeck(deck.id));
		await Promise.all(message.decks.map(this.doLoadDeck));
		message.stacks.forEach(this.doCreateStack);
		inBlockLevel--;
		handleMessages();
	}
	
	async doLoadDeck(message){
		inBlockLevel++;
		let file = await fetch(message.file);
		decks.push(await loadDeckFromZip(message.id, message.file));
		inBlockLevel--;
	}
	
	doDeleteDeck(message){
		let deck = this.decks.splice(this.decks.findIndex(deck => deck.id === message.deckId), 1)[0];
		deck.delete();
	}
	doCreateStack(message){
		this.stacks.push(new Stack(this, message));
	}
	doMoveStack(message){
		this.stacks.find(stack => stack.id === message.stackId).move(message);
	}
	doUpdateStack(message){
		this.stacks.find(stack => stack.id === message.stackId).update(message);
	}
	doDeleteStack(message){
		let stack = this.stacks.splice(this.stacks.findIndex(stack => stack.id === message.stackId))[0];
		stack.delete();
	}
	
	getDeck(deckId){
		return this.decks.find(deck => deck.id == deckId);
	}
	
	send(message){
		this.outQueue.push(message);
	}
	
	sendMessages(){
		while(this.outQueue.length > 0 && this.outBlockLevel == 0){
			sendMessage();
		}
	}
	sendMessage(){
		let message = this.outQueue.unshift();
		this.ws.send(JSON.stringify(message));
	}
}