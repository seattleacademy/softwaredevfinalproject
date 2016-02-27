/* This is a node module that uses built in unix tools in order to pinpoint the best networks for use, and possibly to be able to position some kind of robot
based on network strength and triangulating position*/
"use strict";
var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var child_process = require('child_process');
exports.OutputPath = 'output.json';
var emitter = new EventEmitter();
exports.emitter = emitter; //this is a global event emitter, which will emit a 'finish' event when the callback chain has finished. Nothing can be done with the output file until this callback had been fired.
//necessary globals
var command = child_process.exec; //get core exec function from child_process module
function scan(){
  getNetworkInterface();
}
function getNetworkInterface(){
  command("ifconfig", (err, stdout, stderr)=>{
    if(err){
      console.error(err.stack);
      console.error("make sure you have an accessible wireless interface");
    }else {
      var wirelessname = stdout.match(/w+[a-zA-Z/\d/]+/g);
      console.log("got network interface name");
      getConnectionInfo(wirelessname);
    }
  });
}
function getConnectionInfo(interfacename){
var toRun = "iwlist "+interfacename.toString()+" scan"; /* command to run: iwlist [wireless interface name] scan. This command will get all the connections the interface can detect and give information about their addresses and connection strength*/
console.log(toRun);
  var kid = command(toRun, (err, stdout, stderr)=>{ //create a child process to execute a command
    if (err){
      console.error("Error occurred"); //should print to stderr
    }else {
      console.log("executed iwlist");
      processOutput(stdout);
    }
  });
}
function processOutput(stdout){
//console.log(stdout);
var cells = stdout.split("Cell"); //output divided into "cells", which are connections iwlist found
var objects = [];
for (var i = 1; i < cells.length; i++){
    var temp = new Object();
    var element = cells[i];
    if (element.match(/ESSID:+\"[a-zA-Z]+\"/g) != null){
    temp.ESSID = element.match(/ESSID:+\"[a-zA-Z]+\"/g).toString().replace("ESSID:\"","").replace("\"","");
  }else{
    console.log('parse error');
     continue;
  }
    temp.QUALITY = element.match(/Quality=+\d+\/+\d+/g).toString().replace("Quality=","").replace(",","");
    temp.SIGNAL = element.match(/Signal level=+(\W|\d)+/g).toString().replace("Signal level=","");
    temp.MACADDR = element.match(/Address: +([a-zA-Z]|\d|:)+/g).toString().replace("Address: ","");
    objects.push(temp);
}
objects = sort(objects);
fs.writeFile(exports.OutputPath, JSON.stringify(objects), (err)=>{
  if(err){
    console.log(err.stack);
  }else{
    console.log('write successful');
      exports.emitter.emit('finish'); //emit a global finished event, so any module that includes this file can do things with the data.
  }
});
console.log(objects);
}

function sort (objs) { //do a quick and dity bubble sort
  var minObj = {};
  var temp;
  for (var i = 0; i < objs.length; i++){
    for (var j = 0; j < (objs.length-i-1); j++){
      if (Number(objs[j].SIGNAL) > Number(objs[j+1].SIGNAL)){
        temp = objs[j];
        objs[j] = objs[j+1];
        objs[j+1] = temp;
      }
    }
  }
  return objs;
}
exports.scan = scan;
