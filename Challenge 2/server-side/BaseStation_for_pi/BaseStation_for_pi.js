//check required libraries
var SerialPort = require("serialport");
var app = require('express')();
var http = require('http').Server(app);
var log4js = require("log4js");
var log4js_config = require("./log4js.json");
var mysql = require("mysql");
var moment = require("moment");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1111",
  port: "3306",
  database: "challenge2"
});

//config log file
log4js.configure(log4js_config); 
var LogFile = log4js.getLogger('log_file');

//initial and start serialport
var portName = process.argv[2],
	portConfig = {
		baudRate: 9600,
		parser: SerialPort.parsers.readline("\n")
};

var sp;
sp = new SerialPort.SerialPort(portName, portConfig);




con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    console.log(err);
    return;
  }
  console.log('Connection established');
});

sp.on("open", function () {
	var date_time = moment().format('YYYY-MM-DD H:mm:ss');
	var init_time = date_time;
	var old_date=date_time;
	console.log(init_time);
	setInterval(function() {
		date_time = moment().format('YYYY-MM-DD H:mm:ss');
		var sum=0;
		var count=0;
		var avg=0.00;
		var avg_data={};
		

		if (date_time){			
			con.query("SELECT * FROM sensor_data WHERE time= '"+old_date+"'",function (error, results) {
				if (error)
				{
					console.log('fail to fetch data.'+date_time);
				}
				
				if (results.length>0)
				{
					console.log(results);
					for (var row in results)
					{
						console.log(row);
						sum+=results[row].temp;
						count+=1;
					}
				
				
					avg=sum/count;
					avg_data["sensor_id"]="avg";
					avg_data["time"]=old_date; 
					avg_data["temp"]=avg;
					console.log('The avg temp is '+avg+date_time);
					con.query('INSERT INTO sensor_data SET ?',avg_data, function(err, result)
					{
						if (error){
							console.log('fail to insert data!');
						}
					});
					
					
				
			}
			
		});}console.log('loop end');
		
	}, 2000);//set interval
	sp.on('data', function(data) {
		console.log('data received: ' + data); 
		if (data[0]=='I' && data[1]=='D'){
			var id = parseInt(data.slice(3,5));
			var value = parseFloat(data.slice(6,10));
			var key = "sensor_"+id;
			var obj = {};
			obj["sensor_id"] = key;
			
			obj["temp"] = value;
			if (date_time !== init_time)
			{
				console.log('start insert data');
				obj["time"] = date_time;
				con.query('INSERT INTO sensor_data SET ?', obj, function(error, result)
				{
					if (error){
						console.log('fail to insert new sensor data!');
					}
				});
				old_date=date_time;
			}
			
			
		}
		
	});
});


