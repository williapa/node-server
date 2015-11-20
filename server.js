var app   = require('express')();
var uuid = require('node-uuid');
var crypto = require("crypto");
var http = require('http').Server(app);
var extend = require('lodash').assign;
var mysql = require('mysql');
var bodyParser = require("body-parser");
var connection = mysql.createConnection(extend({
      database: 'library'
    }, config.mysql));
  
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());







//create new appointment
app.post('/appointments/new', function(req,res){

console.log(req.body);

var data = {
	"error":1,
	"Response":"",
	"Appointments":""
};

connection.query("INSERT INTO APPOINTMENT (datetime, doctoremail, uuid, doctorname, location) values (?,?,?,?,?)",[datetime,doctoremail,uuid,doctorname,location],function(err,rows,fields){

	if(!!err){

		data["Response"] = "error inserting appointment.";
		res.json(data);
	}
	else{
		data["error"] = 0;
		data["Response"] = "appointment created successfully! "
		data["Appointments"] = rows;
		res.json(data);
	}

});
});
	
//get appointments for calendarview
app.post('/appointments/doctor',function(req,res){
	console.log("recieved doctor appt request!");
	console.log(req.body);
	doctoremail = req.body.doctoremail;

	var data = {
		"error":1,
		"Appointments":""
	};

	connection.query("SELECT DATETIME FROM APPOINTMENT WHERE doctoremail = ? ORDER BY DATETIME",[doctoremail],function(err,rows,fields){

		if(!!err){
			data["Appointments"] = "error retrieving doctor schedule."
			console.log(data);
			res.json(data);

		}
		else {

			data["error"] = 0;
			data["Appointments"] = rows;
			console.log(data);
			res.json(data);
		}

	});
});

//get user appointments
app.post('/appointments',function(req,res){
	console.log(req.body);

	uuid = req.body.uuid;

	var data = {
		"error":1,
		"Appointments":""
	};

	connection.query("SELECT date, doctorname, doctoremail, location FROM appointment WHERE uuid = ? order by date",[uuid],function(err, rows, fields){
		if(rows.length != 0){
			data["error"] = 0;
			data["Appointments"] = rows;
			res.json(data);
			console.log(data);
		}else {
			data["error"] = 1;
			data["Appointments"] = [{"doctorname":"NO APPOINTMENTS"}];
			res.json(data);
		}

	});

});


//get all locations/doctors
app.get('/locations',function(req,res){
	console.log(req);

	var data = {
		"error":1,
		"Doctors":""
	};
	
	connection.query("SELECT * from doctor",function(err, rows, fields){
		if(rows.length != 0){
			data["error"] = 0;
			data["Doctors"] = rows;
			res.json(data);
			console.log(data);
		}else{

			data["Doctors"] = 'No doctors Found..';
			res.json(data);
			console.log(data);
		}
	});
});


//fetch a particular doctor
app.post('/doctor',function(req,res){
	var nm = req.body.doctorname;
	var data = {
		"error":1,
		"Doctors":"",
	}

	if(!!nm){
		connection.query("SELECT * from doctor WHERE name = ?",[nm],function(err, rows, fields){

			if(!!err){
				data["Doctors"] = "Error Adding User";
			}else{
				data["error"] = 0;
				data["Doctors"] = rows;

			}
			res.json(data);
		});
	}else{
		data["Doctors"] = "Please provide all required data (i.e : Bookname, Authorname, Price)";
		res.json(data);
	}

});

//login patient
app.post('/login',function(req,res){
	console.log(req.body);
	var email = req.body.email;
	var password = req.body.password;
	var data = {
		"error":1,
		"User":"",
		"uuid":"",
	};

	connection.query("SELECT uuid,name,hash FROM user WHERE email = ?",[email],function(err, rows, fields){
		
		if(!!err){
			data["User"] = "error connecting"
		}
		else{

     		var uuid = rows[0].uuid;
     		var hash = rows[0].hash;
     		var nm = rows[0].name;

   			if(hash != crypto.createHash("md5").update(password).digest('hex')){
			console.log(hash);
			console.log(crypto.createHash("md5").update(password).digest('hex'));
			data["User"] = "incorrect username/password.";
			res.json(data);
			console.log(data);
		}

		else{
			data["error"]=0;
			data["User"] = nm;
			data["uuid"] = uuid;
			res.json(data);
			console.log(data);
		}
	}

	});

});

//register user
app.post('/register',function(req,res){
	console.log(req.body);

	var uuid1 = uuid.v1();
	var name = req.body.name;
	var email = req.body.email;
	var phoneno = req.body.phoneno
	var password = req.body.password;
	var data = {
		"error":1,
		"Users":"",
		"uuid":"",
		"name":"",
		"email":""
	};

	var maxtime = 0.1;

	var hash = crypto.createHash("md5").update(password).digest('hex');

     if(!!name && !!email && !!phoneno && !!hash){
				connection.query("INSERT INTO user VALUES(?,?,?,?,?)",[uuid1,name,email,phoneno,hash],function(err, rows, fields){
				if(!!err){
				data["Users"] = "Error Adding User";
			}else{
				data["error"] = 0;
				data["Users"] = "User Added Successfully";
				data["uuid"] = uuid1;
				data["name"] = name;
				data["email"] = email;
			}
			res.json(data);
			console.log(data);
		});
	}else{
		data["Users"] = "Please provide all required data (i.e : Username, email, phoneno, password";
		res.json(data);
		console.log(data);
	}
	
});

//for edit user activities
app.put('/user',function(req,res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var data = {
		"error":1,
		"Users":""
	};
	if( !!username && !!email && !!password){
		connection.query("UPDATE appointmentpal SET email=?, password=? WHERE username=?",[email, password, username],function(err, rows, fields){
			if(!!err){
				data["Users"] = "Error Updating data";
			}else{
				data["error"] = 0;
				data["Users"] = "Updated Book Successfully";
			}
			res.json(data);
		});
	}else{
		data["Users"] = "Please provide all required data (i.e : id, Bookname, Authorname, Price)";
		res.json(data);
	}
});

//fix
app.delete('/user',function(req,res){
	var username = req.body.username;
	var data = {
		"error":1,
		"Users":""
	};
	if(!!username){
		connection.query("DELETE FROM appointmentpal WHERE username=?",[username],function(err, rows, fields){
			if(!!err){
				data["Users"] = "Error deleting data";
			}else{
				data["error"] = 0;
				data["Users"] = "Delete Book Successfully";
			}
			res.json(data);
		});
	}else{
		data["Users"] = "Please provide all required data (i.e : id )";
		res.json(data);
	}
});

http.listen(8080,function(){
	console.log("Connected & Listen to port 8080");
});