import JSZip from "jszip";
import Papaparse from "papaparse";
import {Deck} from "./Deck.js"
import {Card} from "./Card.js"

export async function loadDeckFromZip(controller, source, URL){
	let zip = new JSZip();
	await zip.loadAsync(source);
	let csvText = await zip.file("cards.csv").async("string");
	let cardTable = Papaparse.parse(csvText,{
		header:true,
		skipEmptyLines:"greedy",
		transform: cell=> cell.trim()
	});
	let cards = cardTable.data.map(row => {
		cardTable.meta.fields.forEach(column => row[column] = row[column] || "");
		return new Card(row.$count, row);
	});
	return new Deck(controller, cards, URL);
}