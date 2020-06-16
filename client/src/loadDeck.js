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
			file.async((path.endsWith(".html")||path.endsWith(".xhtml"))? "text": "arraybuffer")
				.then(data  => {
					let blob;
					switch(true){
						case(path.endsWith(".svg")):{
							//svgs are only displayed in <image> elements if they have the correct mime type
							blob = new Blob([data],{"type":"image/svg+xml"});
							break;
						}
						case(path.endsWith(".html")||path.endsWith(".xhtml")):{
							//html can't be displayed in <image>, <iframe> is too expensive preformance-wise, and inlining would allow for script injection
							//however, html can be included in svg's foreignObject, which can be displayed
							data = data.replace(/^\<\![^\>]*\>/,""); //remove <!DOCTYPE...> (not valid xml)
							blob = new Blob([
								'<?xml version="1.0" encoding="UTF-8"?>\n',
								'<svg:svg width="{{$width}}" height="{{$height}}" version="1.1" viewBox="0 0 {{$width}} {{$height}}" xml:space="preserve" xmlns:svg="http://www.w3.org/2000/svg"> xmlns="http://www.w3.org/1999/xhtml"',
								'<svg:foreignObject x="0" y="0" width="{{$width}}" height="{{$height}}" xmlns="http://www.w3.org/1999/xhtml">',
								data,
								'</svg:foreignObject>',
								'</svg:svg>'
							],{"type":"image/svg+xml"});
							break;
						}
						default:{
							blob = new Blob([data]);
						}
					}
					fileBlobs[path] = URL.createObjectURL(blob)
				})
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
		loadFace(replacements.$frontImage, replacements.$frontTemplate, replacements, fileBlobs),
		loadFace(replacements.$backImage, replacements.$backTemplate, replacements, fileBlobs)
	]);
	return new CardDescription(front, back, replacements.$width, replacements.$height, replacements);
}
async function loadFace(image, template, replacements, fileBlobs){ // retuns the card face as a blob URL
	if(image) return fileBlobs[image];
	if(template){
		let templateString = await fetch(fileBlobs[template]).then(res => res.text()); //fetch from blob url;
		for (let column in replacements){
			let value = replacements[column]||"";
			if(fileBlobs[value])value = fileBlobs[value];
			templateString = templateString.split("{{"+column+"}}").join(value);
		}
		return URL.createObjectURL(new Blob([templateString],{"type":"image/svg+xml"}));
	}
	return failedFace;
}
const failedFace = URL.createObjectURL(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect x="0" y="0" width="1" height="1" fill="red"/></svg>'],{"type":"image/svg+xml"}));