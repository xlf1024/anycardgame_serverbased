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
	
	constructor(serverURL, SVGElement){
		this.ws = new WebSocket(serverURL);
		this.ws.binaryType = "blob";
		this.ws.onopen = this.onopen.bind(this);
		this.ws.onmessage = this.onmessage.bind(this);
		this.view = new View(this, SVGElement);
	}
	
	onopen(){
		console.log("open");
		this.outBlockLevel--;
		this.send({
			"action":"resync"
		});
		this.sendMessages();
	}
	
	onmessage(evt){
		this.inQueue.push(JSON.parse(evt.data));
		this.handleMessages();
	}
	handleMessages(){
		while(this.inQueue.length > 0 && this.inBlockLevel == 0){
			this.handleMessage();
		}
	}
	handleMessage(){
		let message = this.inQueue.shift();
		if(message.action === "resync"){
			this.lastMId = message.mId;
			this.doResync(message);
			return;
		}
		if(message.mId > this.lastMId + 1){
			this.send({
				"action":"resync"
			});
			return;
		}
		if(message.mId < this.lastMId){
			return;
		}
		this.lastMId = message.mId;
		switch(message.action){
			case "loadDeck":{
				this.doLoadDeck(message);
				break;
			}
			case "updateStack":{
				this.doUpdateStack(message);
				break;
			}
			case "moveStack":{
				this.doMoveStack(message);
				break;
			}
			case "createStack":{
				this.doCreateStack(message);
				break;
			}
			case "deleteStack":{
				this.doDeleteStack(message);
				break;
			}
			default:{
				alert("unknown message");
				console.error(message);
			}
		}
	}
	
	async doResync(message){
		this.inBlockLevel++;
		this.stacks.slice().forEach(stack => this.doDeleteStack({stackId:stack.id}));
		this.decks.slice().forEach(deck => this.doDeleteDeck({deckId:deck.id}));
		await Promise.all(message.decks.map(deck => this.doLoadDeck(deck)));
		message.stacks.forEach(stack => this.doCreateStack(stack));
		this.inBlockLevel--;
		this.handleMessages();
	}
	
	async doLoadDeck(message){
		this.inBlockLevel++;
		let file = await fetch(message.file).then(res => res.blob());
		this.decks.push(await loadDeckFromZip(message.deckId, file));
		this.inBlockLevel--;
	}
	
	doDeleteDeck(message){
		let deck = this.decks.splice(this.decks.findIndex(deck => deck.id === message.deckId), 1)[0];
		deck.destroy();
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
		let stack = this.stacks.splice(this.stacks.findIndex(stack => stack.id === message.stackId), 1)[0];
		stack.destroy();
	}
	
	getDeck(deckId){
		return this.decks.find(deck => deck.id == deckId);
	}
	
	send(message){
		this.outQueue.push(message);
		this.sendMessages();
	}
	
	sendMessages(){
		while(this.outQueue.length > 0 && this.outBlockLevel == 0){
			this.sendMessage();
		}
	}
	sendMessage(){
		let message = this.outQueue.shift();
		console.log(message);
		this.ws.send(JSON.stringify(message));
	}
}