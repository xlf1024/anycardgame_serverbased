import {loadDeckFromZip} from "./loadDeck.js"

export default class Controller{
	mId = 0;
	sId = 0;
	dId = 0;
	broadcast;
	decks = [];
	stacks = [];
	blockLevel = 0;
	inQueue = [];
	lastResync = 0;
	
	constructor(broadcast){
		this.broadcast = broadcast;
	}
	
	onmessage(message, respond){
		switch(message.action){
			case "resync":{doResync(); break;}
			case "moveStack":{doMoveStack(message, respond); break;}
			case "shuffleStack":{doShuffleStack(message, respond); break;}
			case "reverseStack":{doReverseStack(message, respond); break;}
			case "flipStack":{doFlipStack(message, respond); break;}
			case "mergeStack":{doMergeStack(message, respond); break;}
			case "takeStack":{doTakeStack(message, respond); break;}
			case "createStack":{doCreateStack(message, respond); break;}
			case "filterStack":{doFilterStack(message, respond); break;}
		}
	}
	
	getStack(id){
		return stacks.filter(stack.id === id);
	}
	getDeck(id){
		return decks.filter(stack.id === id);
	}
	
	createStackId(){
		return ++sId;
	}
	
	createDeckId(){
		return ++dId;
	}
	
	doResync(){
		if(mId == lastResync) return;
		mId++;
		lastResync = mId;
		let deckDescriptions = decks.map(deck => {return {id: deck.id, file:deck.file}});
		let stackDescriptions = stacks.map(stack => {return {stackId: stack.id, cards: stack.cards, x:stack.x, y:stack.y, alpha:stack.alpha}});
		this.broadcast({
			mId:this.mId,
			action:"resync",
			decks:deckDescriptions,
			stacks:stackDescriptions,
		})
	}
	
	doMoveStack(message, respond){
		let stack = stacks.splice(stacks.findIndex(stack => stack.id === message.stackId));
		stacks.push(stack);
		stack.move(message.x, message.y, message.alpha);
		sendMoveStack(stack);
	}
	
	doShuffleStack(message, respond){
		let stack = getStack(message.stackId);
		stack.shuffle();
		sendUpdateStack(stack);
	}
	doReverseStack(message, respond){
		let stack = getStack(message.stackId);
		stack.reverse();
		sendUpdateStack(stack);
	}
	doMergeStack(message, respond){
		let movingStack = stacks.splice(stacks.findIndex(stack => stack.id == message.movingStack));
		let stayingStack = getStack(message.stayingStack);
		stayingStack.merge(movingStack, message.where);
		updateStack(stayingStack);
		deleteStack(movingStack);
	}
	doTakeStack(message, respond){
		let stack = getStack(message.stackId);
		let newStack = stack.take(message.count, message.where);
		stacks.push(newStack);
		sendUpdateStack(stack);
		sendCreateStack(newStack);
		sendActivateStack(newStack, respond);
	}
	doCreateStack(message, respond){
		let deck = getDeck(message.deckId);
		let newStack = deck.createStack();
		stacks.push(newStack);
		sendCreateStack(newStack);
		sendActivateStack(newStack, respond);
	}
	doFilterStack(message, respond){
		let stack = getStack(message.stackId);
		let newStack = stack.filter(message.criterion, message.value);
		stacks.push(newStack);
		sendUpdateStack(stack);
		sendCreateStack(newStack);
		sendActivateStack(newStack, respond);
	}
	doDeleteStack(message, respond){
		let stack = stacks.splice(stacks.findIndex(stack => stack.id === message.stackId));
		sendDeleteStack(stack);
	}
	
	sendUpdateStack(stack){
		this.broadcast({
			mId: ++mId,
			action: "updateStack",
			stackId: stack.id,
			cards: stack.cards
		})
	}
	sendMoveStack(stack){
		this.broadcast({
			mId: ++mId,
			action: "moveStack",
			stackId: stack.id,
			x: stack.x,
			y: stack.y,
			alpha: stack.alpha
		})
	}
	sendCreateStack(stack){
		this.broadcast({
			mId: ++mId,
			action: "createStack",
			stackId: stack.id,
			cards: stack.cards,
			x: stack.x,
			y: stack.y,
			alpha: stack.alpha
		})
	}
	sendActivateStack(stack, respond){
		respond({
			mId: mId,
			action: "activateStack",
			stackId: stack.id
		});
	}
	sendDeleteStack(stack){
		this.broadcast({
			mId: ++mId,
			action: "deleteStack",
			stackId: stack.id
		});
	}
	
	async loadDeck(source, URL){
		let deck = await loadDeckFromZip(this, source, URL);
		decks.push(deck);
		sendLoadDeck(deck);
	}
	sendLoadDeck(deck){
		this.broadcast({
			mId: ++mId,
			action: "loadDeck",
			deckId: deck.id,
			file: deck.file
		})
	}
}