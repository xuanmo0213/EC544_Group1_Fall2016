var SerialPort = require("serialport");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var log4js = require("log4js");
var log4js_config = require("./log4js.json");



var Sen_number=4; //provide total sensor number here

log4js.configure(log4js_config); //config log file
console.log("Log start!");
var LogFile = log4js.getLogger('log_file');


var portName = process.argv[2],
	portConfig = {
		baudRate: 9600,
		parser: SerialPort.parsers.readline("\n")
};

var sp;
sp = new SerialPort.SerialPort(portName, portConfig);

app.get('/', function(req, res){
	res.sendfile('index.html');
});

io.on('connection', function(socket){
	LogFile.trace('A user connected.');
	socket.on('disconnect', function(){
	});
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
		sp.write(msg + "\n");
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

sp.on("open", function () {
        console.log('Serial port open!');
	// initial values for calculating
	var count=0;
	var temp = new Array();
	var sum = 0;
	// Measuring period 5 seconds
	setInterval(function() {
		// method to be executed;
		count = 0;
		for(var i=0;i<temp.length;i++){
			if (!isNULL(temp[i])) {
				count++;
				sum += temp[i];
			}
		else {LogFile.warn("Sensor "+i+" data missing");}
		}
		     	
		//var sum = temp.reduce((previous, current) => current += previous);
		if (temp.length===0){ 
			LogFile.error("No data received!");
			io.emit("chat message","No data received!\n");
		}
		else{
			var avg_or = sum / (temp.length-count);
			var avg = avg_or.toFixed(2);
			LogFile.info("Avg temperature:" +avg);
			io.emit("chat message", "Avg temperature:" +avg); //report calculated temperature
		}
		if (count < Sen_number){
			count = Sen_number-count;
			LogFile.warn(count+" sensor(s) failed to report! See log file for details.");
			io.emit("chat message",count+" sensor(s) failed to report! See log file for details.");//report lost sensor data to socket server
	  	}
		temp = [];
		sum =0;
	}, 5000);//set interval
	sp.on('data', function(data) {
		console.log('data received: ' + data); 
		var id = parseInt(data.slice(0,1));
		temp[id]=parseFloat(data.slice(2,6));
		io.emit("chat message", "Sensor " +id + " value: " + temp[id]);
	});
});

var isNULL=function(obj){
	return obj===undefined||obj===null;
}
