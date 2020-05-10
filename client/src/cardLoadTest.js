import {SVGNS} from "./namespaces.js";
import {loadDeckFromZip} from "./loadDeck.js";

let out = document.getElementById("out");
let fileinput = document.getElementById("fileinput");
fileinput.addEventListener("change",evt=>{
	loadDeckFromZip(evt.target.files[0])
		.then(deck=>{
			window.deck = deck;
			deck.forEach(card=>{
				let svg = document.createElementNS(SVGNS, "svg");
				svg.setAttribute("viewBox", `0 0 ${2*card.width} ${card.height}`);
				svg.style.width = 2*card.width + "mm";
				let front = card.front.forSVG();
				front.setAttribute("x", 0);
				front.setAttribute("y", 0);
				svg.appendChild(front);
				let back = card.back.forSVG();
				back.setAttribute("x", card.width);
				back.setAttribute("y", 0);
				svg.appendChild(back);
				out.appendChild(svg);
			});
		});
});