var http = require('http'); 
var proxyName = require('./proxy');
http.createServer(function (req, resp) { 
				console.log("\n----Request header starts----");
        for (e in req.headers) { 
                console.log(e+": "+req.headers[e]); 
        } 
				console.log(proxyName + "----Request header ends----\n");
				var proxy = http.createClient(80, proxyName)
					, proxyRequest = proxy.request(req.method, req.url, req.headers);

				proxyRequest.addListener('response', function (proxyResponse) {
					console.log("\n----Response header starts----");
					for (e in proxyResponse.headers) { 
                console.log(e+": "+proxyResponse.headers[e]); 
        	} 
					console.log("----Response header ends----\n");
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
        
}).listen(7979); 
