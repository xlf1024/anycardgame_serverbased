import http from "http";
import ws from "ws";
import fs from "fs";
const fsp = fs.promises;
import nodeStatic from "node-static";
import path from "path";
import Controller from "./Controller.js";
import {v4 as uuid} from "uuid";
const clients = [];

const httpServer = http.createServer(handleHttp).listen(1024);
const staticServer = new nodeStatic.Server("./",{cache: 0});
const wsServer = new ws.Server({server: httpServer});
wsServer.on("connection",onWsConnect);

function handleHttp(request, response){
	console.log({url:request.url, method:request.method});
	if(request.method == "POST") return handleUpload(request, response);
	let url = path.posix.join(request.url);
	console.log({url});
	if(url === "") return staticServer.serveFile("/client/dist/index.html", 200, {}, request, response);
	try{
		if(url.indexOf("/client/") === 0 || url.indexOf("/node_modules/") === 0) return staticServer.serveFile(url,200, {}, request, response);
		if(url.indexOf("/upload/") === 0) return staticServer.serveFile(url, 200, {"X-Content-Type-Options": "nosniff", "Content-Type": "application/octet-stream", "X-Robots-Tag":"noindex, noarchive, nofollow"}, request, response)
	}catch(e){
		console.error(e);
	}
	response.statusCode = 404;
	response.end();
}

function onWsConnect(socket){
	console.log(socket);
	socket.on("open", ()=>clients.push(socket));
	socket.on("message", onmessage);
	socket.on("close", ()=>clients.splice(clients.findIndex(client => client == socket),1));
	
	function onmessage(data){
		console.log(data);
		try{
			controller.onmessage(JSON.parse(data), response => socket.send(JSON.stringify(response)));
		}catch(e){
			console.error(e);
		}
	}
}

function broadcast(message){
	let json = JSON.stringify(message);
	clients.forEach(client.send(json));
}

async function handleUpload(request, response){
		let filename = "/upload/" + uuid();
		try{
			await fsp.mkdir("./upload/", {recursive:true});
			await fsp.writeFile("./" + filename, "", {flags:fs.constants.O_CREAT});
			let writer = fs.createWriteStream("./" + filename);
			request.pipe(writer);
			await new Promise(resolve => request.addListener("end", resolve));
			let data = await fsp.readFile("./" + filename);
			console.log(data);
			await controller.loadDeck(data,filename);
			response.statusCode = 200;
			response.end();
		}catch(e){
			console.error(e);
			await fsp.unlink("./" + filename);
			response.statusCode = 500;
			response.end();
		}
}

const controller = new Controller(broadcast);