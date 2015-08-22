let path = require('path')
let http = require('http')
let fs = require('fs')
let request = require('request')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logPath = argv.log && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout
// let getLogStream = ()=> logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer((req, res) => {
  // Log the req headers and content in the **server callback**
  // process.stdout.write('\n\n\nEcho request: \n' + JSON.stringify(req.headers))
  logStream.write('\n\n\nEcho request: \n' + JSON.stringify(req.headers))
  // getLogStream('\n\n\nEcho request: \n' + JSON.stringify(req.headers))
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
    //console.log(`Request received at: ${req.url}`)
    // res.end('hello world\n')
    // req.pipe(process.stdout)
    // through(req, getLogStream, {autoDestroy: false})
    req.pipe(logStream, {end: false})
    req.pipe(res, {end: false})
}).listen(8000)

// process.stdout.write('\nListening at http://127.0.0.1:8000\n')
// logStream.write('\nListening at http://127.0.0.1:8000\n')

http.createServer((req, res) => {
  //console.log(`Proxying request to: ${destinationUrl + req.url}`)
  // Proxy code here

  // If present allow the x-destination-url header to override the
  // destinationUrl value
  let url = destinationUrl
  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
    delete req.headers['x-destination-url']
  }
  let options = {
     headers: req.headers,
     // url: `http://${destinationUrl}${req.url}`
     url: url + req.url
 }
 // options.method = req.method

 // process.stdout.write('\n\n\nProxy request: \n' + JSON.stringify(req.headers))
 // req.pipe(process.stdout)

 logStream.write('\n\n\nProxy request to: ${url + req.url}: \n' + JSON.stringify(req.headers))
 req.pipe(logStream, {end: false})

 // Log the proxy request headers and content in the **server callback**
 let downstreamResponse = req.pipe(request(options), {end: false})
 // process.stdout.write(JSON.stringify(downstreamResponse.headers))
 // downstreamResponse.pipe(process.stdout)
 logStream.write(JSON.stringify(downstreamResponse.headers))
 downstreamResponse.pipe(logStream, {end: false})
 downstreamResponse.pipe(res, {end: false})
 // Notice streams are chainable:
 // inputStream -> input/outputStream -> outputStream
 // req.pipe(request(options)).pipe(res)

 // For testing only
 // logStream.write('\n\nRequest headers: ' + JSON.stringify(req.headers) + '\n\n')

}).listen(8001)
