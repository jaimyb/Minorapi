var express = require('express');
var router = express.Router();
var Promise = require('promise');
var Database = require('../database.js');

let database = new Database();

router.get('/byid/:id', function(req, res, next) {
    var id = req.params.id;
	database.query('SELECT * FROM (SELECT * FROM intekening WHERE IntekeningID = ?) AS i left JOIN intekening_status ON i.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = i.opdrachtid left join student on student.StudentID = i.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid', id).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/bystudent/:id/:year', function(req, res, next) {
    var id = req.params.id;
	database.query('SELECT * FROM (SELECT * FROM intekening WHERE studentid = ?) AS i left JOIN intekening_status ON i.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = i.opdrachtid left join student on student.StudentID = i.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid', id).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

// router.get('/bycompany/:id', function(req, res, next) {
//     var id = req.params.id;
// 	database.query('SELECT * FROM intekening AS i left JOIN intekening_status ON i.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = i.opdrachtid left join student on student.StudentID = i.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid WHERE bedrijf.BedrijfID = ?', id).then(rows => { 
// 		console.log(rows);
// 		res.send(JSON.stringify(rows));
// 	});
// });

router.get('/bycompany/:id/:year', function(req, res, next) {
	var id = req.params.id;
	console.log(req.params);
	database.query('SELECT * FROM intekening AS i left JOIN intekening_status ON i.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = i.opdrachtid left join student on student.StudentID = i.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid WHERE opdracht.bedrijfid = ? AND opdracht.schooljaar = ?', [id, req.params.year]).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/byassignment/:id', function(req, res, next) {
    var id = req.params.id;
	database.query('SELECT * FROM (SELECT * FROM intekening WHERE opdrachtid = ?) AS i left JOIN intekening_status ON i.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = i.opdrachtid left join student on student.StudentID = i.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid', [id]).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/all/:year', function(req, res, next) {
	database.query('SELECT * FROM intekening left JOIN intekening_status ON intekening.intekeningstatusid = intekening_status.IntekeningSID left JOIN opdracht on opdracht.OpdrachtID = intekening.opdrachtid left join student on student.StudentID = intekening.studentID left join bedrijf on bedrijf.BedrijfID = opdracht.bedrijfid left join opdracht_status ON opdracht_status.OpdrachtSID = opdracht.opdrachtstatusid WHERE schooljaar = ?', [req.params.year]).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.post('/post/', function(req, res, next) {
	console.log(req.body);
	var body = req.body;
	database.query("INSERT INTO intekening (motivatie, intekeningstatusid, opdrachtid, studentid) VALUES (?,?,?,?)", [body.motivatie, body.intekeningstatusid, body.opdrachtid , body.studentid]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.post('/update/:id', function(req, res, next) {
	console.log(req.body);
	var body = req.body;
	var id = req.params.id;
	database.query("UPDATE intekening SET intekeningstatusid = ? WHERE IntekeningID = ?", [body.IntekeningSID, id]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/status/all', function(req, res, next) {
	console.log("testststs");
	database.query('SELECT * FROM intekening_status').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});


module.exports = router;