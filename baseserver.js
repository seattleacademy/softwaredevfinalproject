var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var networkscanner = require('./networkscanner.js');

//pageName is the same as fileName but with .html instead of .js
pageName = 'winter34_template.html';

//if port not given use this as default
var port = (process.argv[2] ? Number(process.argv[2]) : 1025);
app.listen(port);
console.log("listening on port ", port);
function handler(req, res) {
    fs.readFile(__dirname + '/' + pageName, processFile);

    function processFile(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading ' + pageName);
        }
        res.writeHead(200);
        res.end(data);
    }
}
io.on('connection', (socket)=>{
  socket.on('getwifidata',()=>{
    networkscanner.scan();
    networkscanner.emitter.on('finish',()=>{
      socket.emit('wifidata',readOutputFile());
    })
  });
});
function readOutputFile(){
  var buff = fs.readFileSync(networkscanner.OutputPath);
  return JSON.parse(buff.toString());
}
