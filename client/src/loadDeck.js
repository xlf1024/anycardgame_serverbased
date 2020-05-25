import JSZip from "jszip";
import Papaparse from "papaparse";
import {CardDescription} from "./CardDescription.js";
import {DeckDescription} from "./DeckDescription.js";

export async function loadDeckFromZip(id, source){
	let zip = new JSZip();
	await zip.loadAsync(source);
	let fileBlobs = {};
	let filePromises = [];
	zip.forEach((path,file)=>{
		filePromises.push(
			file.async("blob")
				.then(blob => fileBlobs[path] = URL.createObjectURL(blob))
		);
	});
	let csvText = "";
	filePromises.push(
		zip.file("cards.csv")
			.async("string")
			.then(string => csvText = string)
	);
	await Promise.all(filePromises);
	let cardTable = Papaparse.parse(csvText,{
		header:true,
		skipEmptyLines:"greedy",
		transform: cell=> cell.trim()
	});
	let cards = await Promise.all(cardTable.data.map(row => loadCard(cardTable.meta.fields, row, fileBlobs)));
	
	return new DeckDescription(id, cards, Object.values(fileBlobs));
}
async function loadCard(columns, replacements, fileBlobs){
	columns.forEach(column => replacements[column] = replacements[column] || "");
	const [front, back] = await Promise.all([
		loadFace(replacements.$frontImage, replacements.$frontTemplate, replacements.$frontType, replacements, fileBlobs),
		loadFace(replacements.$backImage, replacements.$backTemplate, replacements.$backType, replacements, fileBlobs)
	]);
	return new CardDescription(front.URL, front.type, back.URL, back.type, replacements.$width, replacements.$height, replacements);
}
async function loadFace(image, template, type, replacements, fileBlobs){ // retuns the card face as a blob URL
	if(image) return {URL: fileBlobs[image], type:"image"};
	if(template){
		let templateString = await fetch(fileBlobs[template]).then(res => res.text()); //fetch from blob url;
		for (let column in replacements){
			let value = replacements[column]||"";
			if(fileBlobs[value])value = fileBlobs[value];
			templateString = templateString.split("{{"+column+"}}").join(value);
		}
		return {URL:URL.createObjectURL(new Blob([templateString])), type: type || "image"};
	}
	return failedFace;
}
const failedFace = {URL:URL.createObjectURL(new Blob(["neither image nor template were specified."])), type:"html"};