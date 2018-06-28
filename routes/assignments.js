var express = require('express');
var router = express.Router();
var Promise = require('promise');
var Database = require('../database.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');


const multer = require('multer');
const storage = multer.diskStorage({
	destination: function(req, file, cb){
		cb(null, './uploads/');
	},
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			console.log(file.originalname);
		  cb(null, raw.toString('hex') + Date.now() + file.originalname);
		});
	}
});
const fileFilter = (req, file, cb) =>{
	if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png')
	{
		cb(null, true);
	}
	else{
		cb(null, false);
	}
};
const upload = multer({storage: storage, fileFilter: fileFilter});

let database = new Database();

//Get all assignments
router.get('/', function(req, res, next) {
	console.log(req.headers);
	database.query('SELECT * FROM opdracht LEFT JOIN opdracht_status ON opdracht.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON opdracht.bedrijfid = bedrijf.BedrijfID').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/all/:year', function(req, res, next) {
	console.log(req.headers);
	database.query('SELECT * FROM opdracht LEFT JOIN opdracht_status ON opdracht.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON opdracht.bedrijfid = bedrijf.BedrijfID WHERE schooljaar = ?',[req.params.year]).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

//Get image by id
router.get('/image/:id', function(req, res, next) {
	var id = req.params.id;
	database.query('SELECT pad FROM opdracht_afbeelding WHERE OpdrachtAfbeeldingID = ?', id).then(row => {
		res.sendFile(path.resolve(row[0].pad));
	});
});

//Delete assignment by assignmentid
router.get('/delete/:id', function(req, res, next) {
	var id = req.params.id;
	database.query('DELETE FROM opdracht WHERE OpdrachtID = ?',id).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

//Get all possible assignment status
router.get('/statuses', function(req, res, next) {
	database.query('SELECT * FROM opdracht_status').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/schoolyears', function(req, res, next) {
	let jaar = GetSchoolyear();
	database.query('SELECT schooljaar FROM schooljaar', [jaar]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/byschoolyear/:year', function(req, res, next) {
	let year = req.params.year;
	database.query('SELECT * FROM opdracht LEFT JOIN opdracht_status ON opdracht.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON opdracht.bedrijfid = bedrijf.BedrijfID WHERE schooljaar = ?', [year]).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

function GetSchoolyear(){
    let year = Number(new Date().getFullYear());
    if(new Date().getMonth() < 7){
      return (year - 1).toString() + '-' + year.toString(); 
    }
    else{
      return year.toString() + '-' + (year + 1).toString(); 
    }
  }

router.get('/semesters', function(req, res, next) {
	database.query('SELECT * FROM semester').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

///Get assignment by id
router.get('/byid/:id', function(req, res, next) {
	var id = req.params.id;
	let assignments;
	database.query("SELECT * FROM (SELECT * FROM opdracht WHERE opdrachtID = ? ) AS o LEFT JOIN opdracht_status ON o.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON o.bedrijfid = bedrijf.BedrijfID", id).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/bycompanyid/:id/:year', function(req, res, next) {
	database.query("SELECT * FROM (SELECT * FROM opdracht WHERE bedrijfid = ? ) AS o LEFT JOIN opdracht_status ON o.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON o.bedrijfid = bedrijf.BedrijfID", [req.params.id, req.params.year]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

///Get availible assignments
router.get('/availible/:year', function(req, res, next) {
	database.query("SELECT * FROM (SELECT * FROM opdracht WHERE opdrachtstatusid = 1) AS o LEFT JOIN opdracht_status ON o.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON o.bedrijfid = bedrijf.BedrijfID WHERE schooljaar = ?",[req.params.year]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

//Update assignment
router.post('/update/:id',upload.single('opdrachtAfbeelding'), function(req, res, next) {
	var id = req.params.id;
	var body = req.body;
	console.log(body);
	if(req.file != undefined){
		database.query("UPDATE opdracht SET titel = ?, beschrijving = ?, ec = ?, opdrachtstatusid = ?, opdrachtafbeelding = ?, semester = ?, schooljaar = ? WHERE OpdrachtID = ?", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, file.path.replace(/\\/g, "/"), body.semester, body.schooljaar, id]).then(rows => { 
			res.send(JSON.stringify(rows));
		});
	}
	else{
		database.query("UPDATE opdracht SET titel = ?, beschrijving = ?, ec = ?, opdrachtstatusid = ?, semester = ?, schooljaar = ? WHERE OpdrachtID = ?", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, body.semester, body.schooljaar, id]).then(rows => { 
			res.send(JSON.stringify(rows));
		});
	}
});

//Post new assignment
router.post('/post', upload.single('opdrachtAfbeelding'),function(req, res, next) {
	var body = req.body;
	database.query("INSERT INTO opdracht (titel, beschrijving, ec, opdrachtstatusid, bedrijfid, opdrachtAfbeelding, semester, schooljaar) VALUES (?,?,?,?,?,?,?,?)", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, body.bedrijfid, req.file.path.replace(/\\/g, "/"), body.semester, body.schooljaar]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

//Upload assignmentimage by assignmentid
router.post('/uploadimage/:id', upload.single('opdrachtAfbeelding'),function(req, res, next) {
	var id = req.params.id;
	console.log(body);
	database.query("INSERT INTO opdracht_afbeelding (pad, opdrachtid) VALUES (?,?)", [req.file.path.replace(/\\/g, "/"), id]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});


//Get image data by assignmentid
router.get('/imagedata/:id', function(req, res, next) {
	var id = req.params.id;
	database.query('SELECT * FROM opdracht_afbeelding WHERE opdrachtid = ?', id).then(rows => {
		res.send(JSON.stringify(rows));
	});
});

//Delete image by imageid
router.get('/deleteimage/:id', function(req, res, next) {
	var id = req.params.id;
	database.query("SELECT pad FROM opdracht_afbeelding WHERE OpdrachtAfbeeldingID = ?", [id]).then(rows => {
		fs.unlink(path.resolve(rows[0].pad));
		return database.query("DELETE FROM opdracht_afbeelding WHERE OpdrachtAfbeeldingID = ?", [id]);
	}).then(rows =>{
		res.send(JSON.stringify(rows));
	});
});


//Upload multiple images by id
router.post('/uploadimages/:id', upload.array("opdrachtAfbeeldingen"),function(req, res, next){
	var id = req.params.id;
	console.log(req.files);
	req.files.forEach(file => {
		console.log(file);
		database.query("INSERT INTO opdracht_afbeelding (pad, opdrachtid) VALUES (?,?)", [file.path.replace(/\\/g, "/"), id]).then(rows => { 
			
		});
	});
	res.send(JSON.stringify({true: true}));
});

module.exports = router;