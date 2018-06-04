var express = require('express');
var router = express.Router();
var Promise = require('promise');
var Database = require('../database.js');

let database = new Database();

router.get('/byproject/:id', function(req, res, next) {
    var id = req.params.id;

	database.query('SELECT student.StudentID, student.voornaam, student.achternaam, student.studentnummer, student.klas, student.studentemail FROM student JOIN (SELECT * FROM intekening WHERE intekening.opdrachtid = ? AND intekening.intekeningstatusid = 1) AS test', id).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/', function(req, res, next) {
	database.query('SELECT * FROM student').then(rows => { 
		res.send(JSON.stringify(rows));
	});
});



module.exports = router;