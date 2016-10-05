var express = require('express'),
    app = express(),
    http = require('http').Server(app);
    mysql   = require('mysql'),

        connection = mysql.createConnection({
          host: 'localhost',
	  port: "3306",
          user: 'root',
          password: '1111',
          database: 'challenge2'
        }),   

        //In Node mysql, we can use pooling directly to handle multiple connection and reuse the connection.
        pool = mysql.createPool({
            connectionLimit : 1000,
            host: 'localhost',
            user: 'root',
            password: '1111',
            database: 'challenge2'
        });
function initConnection(){
    connection.connect(function(err){
        if(!err){
            console.log("Database is connected. ");
        }else{
            console.log("Error connecting database");
        }
    });
}
function reportError(){
    res.json({"code" : 100, "status" : "Error in connection"});
    return;
}

/********************************************************************************************/
initConnection();
app.get('/',function(req,res){
    res.sendfile('index.html');
});
app.get('/history', function(req, res){
	res.sendfile('history_page.html');
});
app.get('/realtime', function(req, res){
    res.sendfile('real_time_page.html');
});

app.get('/api/history/:date', function(req, res){
    var dates = new Array();
    dates = req.params.date.split("_");
    console.log(dates[0]  +"   "+ dates[1])
    console.log('Gonna run get_historical_function')  
    pool.getConnection(function(err, connection){        
        if(err){ reportError(req,res); }
        console.log('connected as id ' + connection.threadId);                
        connection.query("SELECT time, group_concat(sensor_id separator ',') as 'data' FROM (SELECT time, concat(sensor_id,':',group_concat(temp separator ',')) as sensor_id FROM sensor_data Group by time, sensor_id)sensor_data  WHERE time > '"+ dates[0] + "' and time < '" + dates[1]+ "' Group by time" ,function(err, rows, field){
            res.json(rows);
        });
        
    });
});

app.get('/api/realtime/:date', function(req, res){
    pool.getConnection(function(err, connection){
        var currdate = req.params.date;
        console.log(currdate);
        connection.query("SELECT time, group_concat(sensor_id separator ',') as 'data' FROM (SELECT time, concat(sensor_id,':',group_concat(temp separator ',')) as sensor_id FROM sensor_data Group by time, sensor_id)sensor_data  WHERE time > '"+ currdate + "' - INTERVAL 40 SECOND Group by time",function(err, rows, field){
            res.json(rows);
        });
    });
});

app.get("/api/minmax",function(req,res){
     pool.getConnection(function(err, connection){
        connection.query("select min(time) as 'mintime',max(time) as 'maxtime'from sensor_data",function(err, rows, field){
            res.json(rows);
        });
    });   
});

app.use('/static', express.static(__dirname));

app.listen(3002);
