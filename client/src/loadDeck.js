import JSZip from "jszip";
import Papaparse from "papaparse";
import {CardDescription} from "./CardDescription.js"

export async function loadDeckFromZip(source){
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
		transform: cell=>{ //replace filenames with their blob URLs
			let cellt = cell.trim();
			return cellt in fileBlobs ? fileBlobs[cellt] : cell;
		}
	});
	let deck = await Promise.all(cardTable.data.map(row => loadCard(cardTable.meta.fields, row)));
	
	return deck;
}
async function loadCard(columns, replacements){
	columns.forEach(column => replacements[column] = replacements[column] || "");
	const [front, back] = await Promise.all([
		loadFace(replacements.$frontImage, replacements.$frontTemplate, columns, replacements),
		loadFace(replacements.$backImage, replacements.$backTemplate, columns, replacements)
	]);
	return new CardDescription(front.URL, front.type, back.URL, back.type, replacements.$width, replacements.$height, replacements);
}
async function loadFace(image, template, replacements){ // retuns the card face as a blob URL
	if(image) return {URL: image, type:"image"};
	if(template){
		let templateString = await fetch(template).then(res => res.text()); //fetch from blob url;
		for (let column in replacements){
			templateString = templateString.split("{{"+column+"}}").join(replacements[column]||"");
		}
		return {URL:URL.createObjectURL(new Blob([templateString])),type:"template"};
	}
	return failedFace;
}
const failedFace = {URL:URL.createObjectURL(new Blob(["neither image nor template were specified."])), type:"template"};