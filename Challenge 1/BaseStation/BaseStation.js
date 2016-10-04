/*
  Steps for set up temperature monitoring script;
  Set Sen_number value to the total number of sensors.
  Set measuring intervals are defined with interval_sensor in ms. Change if you need a different measuring period.
  Clean the log file under .\logs\log_file, there are backup base on data in .\logs\log_date
  Start running the script, after see "A user connected.", visit http://localhost:3000 for the local socket server.
  Check log file if you need extra infomation for the sensors status.
*/

var SerialPort = require("serialport");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//include json config file for log
var log4js = require("log4js");
var log4js_config = require("./log4js.json");


var Sen_number=3; //provide total sensor number here
var interval_sensor=5000;

log4js.configure(log4js_config); //config log file
console.log("Log start!");
var LogFile = log4js.getLogger('log_file');

//config serial port
var portName = process.argv[2],
	portConfig = {
		baudRate: 9600,
		parser: SerialPort.parsers.readline("\n")
};

//require serialport
var sp;
sp = new SerialPort.SerialPort(portName, portConfig);

//indicate socket index page
app.get('/', function(req, res){
	res.sendfile('index.html');
});

//setups for socket.io
io.on('connection', function(socket){
	LogFile.trace('A user connected.');
	socket.on('disconnect', function(){
	});
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
		sp.write(msg + "\n");
	});
});

//set port as 3000, which mean visit localhost:3000 when run server on your own computer
http.listen(3000, function(){
	console.log('listening on *:3000');
});

//functions for monitoring 
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
		    else { LogFile.warn("Sensor "+i+" data missing");}
		}
		     	
		//var sum = temp.reduce((previous, current) => current += previous);
		if (temp.length===0){ 
			LogFile.error("No data received!");
			io.emit("chat message","No data received!\n");
		}
		else{
			var avg_or = sum /count;
			var avg = avg_or.toFixed(2);
			// create timestamp here when use database to store
			LogFile.info("Avg temperature:" +avg);
			io.emit("chat message", "Avg temperature:" +avg); //report calculated temperature
		}
		if (count < Sen_number){
			for ( i=temp.length;i<Sen_number;i++)
			{
			LogFile.warn("Sensor "+i+" data missing");
			}
			count = Sen_number-count;
			
			LogFile.warn(count+" sensor(s) failed to report!");
			io.emit("chat message",count+" sensor(s) failed to report! See log file for details.");//report lost sensor data to socket server
	  	}
		temp = [];
		sum =0;
	}, interval_sensor);//set interval here
	
	//actions when any data received.
	sp.on('data', function(data) {
		console.log('data received: ' + data); 
		var id = parseInt(data.slice(0,1));
		temp[id]=parseFloat(data.slice(2,6));
		io.emit("chat message", "Sensor " +id + " value: " + temp[id]);
	});
});

var isNULL=function(obj){
	if (obj===undefined)
	return true;
}
