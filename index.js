let http = require('http')
let fs = require('fs')
let request = require('request')
let through = require('through')
let argv = require('yargs')
	.default('host', '127.0.0.1')
	.argv
// Set the default scheme to http for now
let scheme = 'http://'
// Get the --port value; if none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
// Get the --url value; if none, construct the destinationUrl from scheme, host and port
let destinationUrl = argv.url || scheme + argv.host + ':' + port
// Get the --logfile value; if none, default to stdout
let logStream = argv.log ? fs.createWriteStream(argv.log) : process.stdout

http.createServer((req, res) => {
	logStream.write('\nEcho request: \n' + JSON.stringify(req.headers))
	for (let header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	through(req, logStream, {autoDestroy: false})
	req.pipe(res)
}).listen(8000)

logStream.write('listening on http://127.0.0.1:8000')



http.createServer((req, res) => {
	let url = destinationUrl
	if (req.headers['x-destination-url']) {
		url = req.headers['x-destination-url']
	}
	let options = {
		headers: req.headers,
		url: url + req.url
	}
	logStream.write('\nProxying request to: ' + url + req.url)

	logStream.write('\nProxy request: \n' + JSON.stringify(req.headers))
	through(req, logStream, {autoDestroy: false})

	let destinationResponse = req.pipe(request(options))

	logStream.write(JSON.stringify(destinationResponse.headers))
	destinationResponse.pipe(res)
	through(destinationResponse, logStream, {autoDestroy: false})

}).listen(8001)
