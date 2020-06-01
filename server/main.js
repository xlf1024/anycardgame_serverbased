import http from "http";
import ws from "ws";
import fs from "fs";
const fsp = fs.promises;
import nodeStatic from "node-static";
import path from "path";
import Controller from "./Controller.js";
import {v4 as uuid} from "uuid";
const clients = [];

const name = process.argv[2];
const password = process.argv[3];
const httpServer = http.createServer(handleHttp).listen(1024);
const staticServer = new nodeStatic.Server("./",{cache: 0});
const wsServer = new ws.Server({noServer: true});
wsServer.on("connection",onWsConnect);
httpServer.on("upgrade", onHttpUpgrade);

function handleHttp(request, response){
	console.log({url:request.url, method:request.method});
	
	if(!testHttpAuth(request)){
		response.statusCode = 401;
		response.setHeader("WWW-Authenticate", 'Basic charset="UTF-8"');
		response.end();
		return;
	}
	
	if(request.method == "POST") return handleUpload(request, response);
	let url = path.posix.join(request.url);
	console.log({url});
	if(url === "" || url === "/"){
		response.writeHead(307, {Location:"/client/dist/index.html"});
		response.end();
		return;
	}
	try{
		if(url.indexOf("/client/") === 0 || url.indexOf("/node_modules/") === 0) return staticServer.serveFile(url,200, {}, request, response, staticServed);
		if(url.indexOf("/upload/") === 0) return staticServer.serveFile(url, 200, {"X-Content-Type-Options": "nosniff", "Content-Type": "application/octet-stream", "X-Robots-Tag":"noindex, noarchive, nofollow"}, request, response, staticServed);
	}catch(e){
		console.error(e);
	}
	response.statusCode = 403;
	response.end();
}

function staticServed(err, result){
	if(err){
		console.log("staticServed");
		response.writeHead(err.status, err.headers);
		response.end();
	}
}

function testHttpAuth(request){
	if(!request.headers.authorization) return false;
	
	if(!request.headers.authorization.startsWith("Basic ")) return false;
	
	let [sentName,sentPassword] = atob(request.headers.authorization.split(" ")[1]).split(":");
	
	return sentName === name && sentPassword === password;
}
function atob(base64){
	return Buffer.from(base64, "base64").toString("utf8");
}

function onHttpUpgrade(request, socket, head){
	if(!testHttpAuth(request)){
		socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
		socket.destroy();
		return;
	}
	wsServer.handleUpgrade(request, socket, head, (ws)=>wsServer.emit("connection",ws,request));
}
function onWsConnect(ws){
	console.log(ws);
	clients.push(ws);
	ws.on("message", onmessage);
	ws.on("close", ()=>{console.log("close");clients.splice(clients.findIndex(client => client == ws),1)});
	
	function onmessage(data){
		console.log(data);
		try{
			controller.onmessage(JSON.parse(data), response => ws.send(JSON.stringify(response)));
		}catch(e){
			console.error(e);
		}
	}
}

function broadcast(message){
	let json = JSON.stringify(message);
	console.log(json);
	clients.forEach(client => client.send(json));
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