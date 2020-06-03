import http from "http";
import https from "https";
import ws from "ws";
import fs from "fs";
const fsp = fs.promises;
import Argr from "argr";
import nodeStatic from "node-static";
import path from "path";
import Controller from "./Controller.js";
import {v4 as uuid} from "uuid";
const clients = [];

let fileConfig;
try{
	fileConfig = JSON.parse(fs.readFileSync("config.json"),{encoding:"utf8"});
}catch(e){
	console.error("loading config.json failed. See config-template.json for an example:", e);
	fileConfig = {};
}

let argr = Argr();
argr.option(["P","port"],"port");
argr.option(["v","viewlogin"],"user login credentials for spectating, format name:password");
argr.option(["p","playlogin"],"user login credentials for playing, format name:password");
argr.option(["u","uploadlogin"],"user login credentials for uploading cards and playing, format name:password");
argr.option(["c","chain","certchain"],"path to https certificate chain in pem format.");
argr.option(["k","key","privkey"], "path to https private key in pem format");
argr.init(process.argv);

const port = Number(argr.get("port")) || Number(fileConfig.port);
const viewLogins = [argr.get("viewlogin") || []].flat();
const playLogins = [argr.get("playlogin") || []].flat();
const uploadLogins = [argr.get("uploadlogin") || []].flat();
const certChainPath = argr.get("chain") || fileConfig.chain;
const privateKeyPath = argr.get("key") || fileConfig.key;

console.log("using config:")
console.log({port, viewLogins, playLogins, uploadLogins, certChainPath, privateKeyPath});

let httpServer;
try{
	const certChain = fs.readFileSync(certChainPath);
	const privateKey = fs.readFileSync(privateKeyPath);
	console.log("certificates loaded. starting server");
	httpServer = https.createServer({
		cert:certChain,
		key:privateKey
	},handleHttp).listen(port);
}catch(e){
	console.error("Loading certificates failed; using http instead:", e);
	httpServer = http.createServer(handleHttp).listen(port);
}
const staticServer = new nodeStatic.Server("./",{cache: 0});
const wsServer = new ws.Server({noServer: true});
wsServer.on("connection",onWsConnect);
httpServer.on("upgrade", onHttpUpgrade);

function handleHttp(request, response){
	console.log("[[",request.method,"]]",readAuth(request),"@",request.socket.remoteAddress,":",request.socket.remotePort, request.url);
	
	if(!testHttpAuth(request)){
		response.statusCode = 401;
		response.setHeader("WWW-Authenticate", 'Basic charset="UTF-8"');
		response.end();
		return;
	}
	
	if(request.method == "POST") return handleUpload(request, response);
	let url = path.posix.join(request.url);
	//console.log({url});
	if(url === "" || url === "/"){
		response.writeHead(307, {Location:"/client/dist/index.html"});
		response.end();
		return;
	}
	try{
		if(url.indexOf("/client/") === 0 || url.indexOf("/node_modules/") === 0) return staticServer.serveFile(url,200, {}, request, response).addListener("error", staticError);
		if(url.indexOf("/upload/") === 0) return staticServer.serveFile(url, 200, {"X-Content-Type-Options": "nosniff", "Content-Type": "application/octet-stream", "X-Robots-Tag":"noindex, noarchive, nofollow"}, request, response).addListener("error", staticError);
	}catch(e){
		console.error(e);
	}
	response.statusCode = 403;
	response.end();

	function staticError(err){
		console.log("staticServed");
		response.statusCode = 404;
		response.write("404");
		response.end();
	}
}
function readAuth(request){
	if(!request.headers.authorization) return null;
	if(!request.headers.authorization.startsWith("Basic ")) return null;
	return atob(request.headers.authorization.split(" ")[1]);
}
function testHttpAuth(request){
	let auth = readAuth(request);
	if(!auth) return false;
	
	if(uploadLogins.indexOf(auth)!==-1) return "upload";
	if(playLogins.indexOf(auth)!==-1) return "play";
	if(viewLogins.indexOf(auth)!==-1) return "view";
	
	return false;
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

function onWsConnect(ws, request){
	let socket = request.socket;
	let permission = testHttpAuth(request);
	console.log("client connected",readAuth(request),"@", socket.remoteAddress, ":", socket.remotePort);
	clients.push(ws);
	ws.on("message", onmessage);
	ws.on("close", ()=>{console.log("close");clients.splice(clients.findIndex(client => client == ws),1)});
	
	function onmessage(data){
		console.log("<<",socket.remoteAddress,":",socket.remotePort,"<<",data);
		try{
			let json = JSON.parse(data);
			if(permission === "play" || permission === "upload" || json.action === "resync"){
				controller.onmessage(json, respond);
			}
		}catch(e){
			console.error(e);
		}
	}
	
	function respond(data){
		console.log(">>",socket.remoteAddress,":",socket.remotePort,">>",data);
		ws.send(JSON.stringify(data));
	}
}

function broadcast(message){
	let json = JSON.stringify(message);
	console.log(">>>>",message);
	clients.forEach(client => client.send(json));
}

async function handleUpload(request, response){
	if(testHttpAuth(request)!=="upload"){
		response.statusCode = 403;
		response.end();
		return;
	}
	
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