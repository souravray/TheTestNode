var http = require('http')
	, proxyName = require('./proxy')
	, fs = require('fs')
	, url = require('url')
  , io = require('socket.io')
  , colors = require('./termcolors').colors;

var web = http.createServer(function (req, resp){
	var pathname = url.parse(req.url).pathname;
	if (pathname == "/") {
		pathname = "/index.html";
	}
	var ext = pathname.substr(pathname.lastIndexOf('.') + 1);
	io.sockets.emit('payload', pathname);
	io.sockets.emit('payload', ext);
	fs.readFile(__dirname + pathname, function (err, data) {
		if (err) {
			resp.writeHead(500);
			return resp.end('Error loading index.html');
		}
		var ctype = 'text/plain';
		if (ext == 'html') {
			ctype = 'text/html';
		}
		if (ext == 'js') {
			ctype = 'application/javascript';
		} 
		resp.writeHead(200, {'Content-Type':ctype});
		resp.end(data);
	});
}).listen(9090, function(){
  console.log("TestNode web-console is running on Port: 9090");
})
, io = io.listen(web);


http.createServer(function (req, resp) { 
	//----Request header starts----
	var proxyURL=req.method+" "+proxyName+req.url;
	console.log();
	for (e in req.headers) { 
		console.log(colors.cyan(colors.bold(e))+":\t\t"+req.headers[e] + ((e=='host')?"\t"+colors.bg_cyan(colors.dgray(proxyURL)):"") ); 
	//	io.sockets.emit('updatelog', e, req.headers[e]);
	} 
	
	var proxy = http.createClient(80, proxyName)
	, proxyRequest = proxy.request(req.method, req.url, req.headers);
	
	proxyRequest.addListener('response', function (proxyResponse) {
		//----Response header starts----
		var responseColor="blue";
		if(/2\d{2}/.test(proxyResponse.statusCode)){
			responseColor="green";
   	} else if(/3\d{2}/.test(proxyResponse.statusCode)){
			responseColor="yellow";
		} else if(/4\d{2}/.test(proxyResponse.statusCode)){
			responseColor="red";
		} else  if(/5\d{2}/.test(proxyResponse.statusCode)){
			responseColor="purple";
		}
		console.log("\n"+colors[responseColor]("HTTP Status Code") +':\t' + colors['bg_'+responseColor](colors.white(proxyResponse.statusCode)));
		for (e in proxyResponse.headers) { 
			console.log(colors[responseColor](colors.bold(e))+":\t\t"+proxyResponse.headers[e]); 
		} 
		io.sockets.emit('updatelog', req.headers, proxyResponse.headers);
		proxyResponse.addListener('data', function(chunk) {
			resp.write(chunk, 'binary');
		});

		proxyResponse.addListener('end', function() {
			resp.end();
		});
		resp.writeHead(proxyResponse.statusCode, proxyResponse.headers);
	});
	
	req.addListener('data', function(chunk) {
		proxyRequest.write(chunk, 'binary');
	});
	
	req.addListener('end', function() {
		proxyRequest.end();
	});        
}).listen(7979, function(){
	console.log("TestNode is running on port: 7979");
}); 
