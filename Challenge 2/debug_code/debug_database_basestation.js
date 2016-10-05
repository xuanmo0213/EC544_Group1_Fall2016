//check required libraries
var SerialPort = require("serialport");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var log4js = require("log4js");
var log4js_config = require("./log4js.json");
var mysql = require("mysql");
var moment = require("moment");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "r00tme",
  port: "3306",
  database: "test"
});



//var Sen_number=4; //provide total sensor number here

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
		
		
		//console.log('date_time search '+ date_time.toString());
		
		//console.log(dformat);
		if (date_time){
			//console.log('enter avg cal');
			console.log('SELECT * FROM students WHERE time= '+old_date);
			con.query("SELECT * FROM students WHERE time= '"+old_date+"'",function (error, results) {
				if (error)
				{
					console.log('fail to fetch data.'+date_time);
				}
				//console.log(results);
				if (results.length>0)
				{
					console.log(results);
					for (var row in results)
					{
						console.log(row);
						sum+=results[row].temp;
						count+=1;
					}
				//console.log('sum is '+sum);
				//console.log('count is ' + count);
					avg=sum/count;
					avg_data["sensor_id"]="avg";
					avg_data["time"]=old_date;
					avg_data["temp"]=avg;
					console.log('The avg temp is '+avg+date_time);
				//console.log(count+' data received!');
					con.query('INSERT INTO students SET ?',avg_data, function(err, result)
					{
						if (error){
							console.log('fail to insert data!');
						}
					});
					
					io.emit("chat message", avg);
				
			}
			
		});}console.log('loop end');
		//date_time = moment().format('YYYY-MM-DD H:mm:ss');
		
		//console.log(date_time);
		//console.log(date_time);
		
		
	}, 2000);//set interval
	sp.on('data', function(data) {
		console.log('data received: ' + data); 
		if (data[0]=='I' && data[1]=='D'){
			var id = parseInt(data.slice(3,5));
			var value = parseFloat(data.slice(6,10));
			//console.log('id is '+id);
			//console.log('data is '+value);
			var key = "sensor_"+id;
			var obj = {};
			obj["sensor_id"] = key;
			
			obj["temp"] = value;
			if (date_time !== init_time)
			{
				console.log('start insert data');
				obj["time"] = date_time;
				console.log('date time is ' + date_time+value);
				con.query('INSERT INTO students SET ?', obj, function(error, result)
				{
					if (error){
						console.log('fail to insert new sensor data!');
					}
				});
				old_date=date_time;
			}
			
			
		}
		io.emit("chat message", data);
	});
});

var isNULL=function(obj){
	return obj===undefined||obj===null||obj==='NULL';
}



    
 
