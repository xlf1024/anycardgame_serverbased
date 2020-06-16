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
			case "resync":{this.doResync(respond); break;}
			case "moveStack":{this.doMoveStack(message, respond); break;}
			case "shuffleStack":{this.doShuffleStack(message, respond); break;}
			case "reverseStack":{this.doReverseStack(message, respond); break;}
			case "flipStack":{this.doFlipStack(message, respond); break;}
			case "mergeStack":{this.doMergeStack(message, respond); break;}
			case "takeStack":{this.doTakeStack(message, respond); break;}
			case "createStack":{this.doCreateStack(message, respond); break;}
			case "filterStack":{this.doFilterStack(message, respond); break;}
			default:{console.error("unkown action:");console.error(message);}
		}
	}
	
	getStack(id){
		return this.stacks.find(stack => stack.id === id);
	}
	spliceStack(id){
		return this.stacks.splice(this.stacks.findIndex(stack => stack.id === id),1)[0];
	}
	getDeck(id){
		return this.decks.find(deck => deck.id === id);
	}
	
	createStackId(){
		return ++this.sId;
	}
	
	createDeckId(){
		return ++this.dId;
	}
	
	doResync(respond){
		let deckDescriptions = this.decks.map(deck => {return {deckId: deck.id, file:deck.file}});
		let stackDescriptions = this.stacks.map(stack => {return {stackId: stack.id, cards: stack.cards, x:stack.x, y:stack.y, alpha:stack.alpha}});
		
		if(this.mId == this.lastResync){
			respond({
				mId:this.mId,
				action:"resync",
				decks:deckDescriptions,
				stacks:stackDescriptions,
			})
		}else{
			this.mId++;
			this.lastResync = this.mId;
			this.broadcast({
				mId:this.mId,
				action:"resync",
				decks:deckDescriptions,
				stacks:stackDescriptions,
			})
		}
	}
	
	
	doMoveStack(message, respond){
		let stack = this.spliceStack(message.stackId);
		this.stacks.push(stack);
		stack.move(message.x, message.y, message.alpha);
		this.sendMoveStack(stack);
	}
	
	doShuffleStack(message, respond){
		let stack = this.getStack(message.stackId);
		stack.shuffle();
		this.sendUpdateStack(stack);
	}
	doReverseStack(message, respond){
		let stack = this.getStack(message.stackId);
		stack.reverse();
		this.sendUpdateStack(stack);
	}
	doFlipStack(message, respond){
		let stack = this.getStack(message.stackId);
		stack.flip();
		this.sendUpdateStack(stack);
	}
	doMergeStack(message, respond){
		if(message.movingStack == message.stayingStack) return;
		let movingStack = this.spliceStack(message.movingStack);
		let stayingStack = this.getStack(message.stayingStack);
		stayingStack.merge(movingStack, message.where);
		this.sendUpdateStack(stayingStack);
		this.sendDeleteStack(movingStack);
	}
	doTakeStack(message, respond){
		let stack = this.getStack(message.stackId);
		let newStack = stack.take(message.count, message.where);
		if(newStack.cards.length<=0)return;
		this.stacks.push(newStack);
		this.sendUpdateStack(stack);
		this.sendCreateStack(newStack);
		this.sendActivateStack(newStack, respond);
	}
	doCreateStack(message, respond){
		let deck = this.getDeck(message.deckId);
		let newStack = deck.createStack();
		if(newStack.cards.length<=0)return;
		this.stacks.push(newStack);
		this.sendCreateStack(newStack);
		this.sendActivateStack(newStack, respond);
	}
	doFilterStack(message, respond){
		let stack = this.getStack(message.stackId);
		let newStack = stack.filter(message.criterion, message.value);
		if(newStack.cards.length<=0)return;
		this.stacks.push(newStack);
		this.sendUpdateStack(stack);
		this.sendCreateStack(newStack);
		this.sendActivateStack(newStack, respond);
	}
	doDeleteStack(message, respond){
		let stack = this.spliceStack(message.stackId);
		this.sendDeleteStack(stack);
	}
	sendUpdateStack(stack){
		if(stack.cards.length <= 0){
			this.doDeleteStack({stackId:stack.id}, ()=>{});
		}else{
			this.broadcast({
				mId: ++this.mId,
				action: "updateStack",
				stackId: stack.id,
				cards: stack.cards
			})
		}
	}
	sendMoveStack(stack){
		this.broadcast({
			mId: ++this.mId,
			action: "moveStack",
			stackId: stack.id,
			x: stack.x,
			y: stack.y,
			alpha: stack.alpha
		})
	}
	sendCreateStack(stack){
		this.broadcast({
			mId: ++this.mId,
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
			mId: this.mId,
			action: "activateStack",
			stackId: stack.id
		});
	}
	sendDeleteStack(stack){
		this.broadcast({
			mId: ++this.mId,
			action: "deleteStack",
			stackId: stack.id
		});
	}
	
	async loadDeck(source, URL){
		let deck = await loadDeckFromZip(this, source, URL);
		this.decks.push(deck);
		this.sendLoadDeck(deck);
	}
	sendLoadDeck(deck){
		this.broadcast({
			mId: ++this.mId,
			action: "loadDeck",
			deckId: deck.id,
			file: deck.file
		})
	}
}