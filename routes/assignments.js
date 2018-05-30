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
	database.query('SELECT * FROM opdracht LEFT JOIN opdracht_status ON opdracht.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON opdracht.bedrijfid = bedrijf.BedrijfID').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/images/:id', function(req, res, next) {
	var id = req.params.id;
	database.query('SELECT * FROM opdracht_afbeelding WHERE opdrachtid = ?', id).then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});

router.get('/delete/:id', function(req, res, next) {
	var id = req.params.id;
	database.query('DELETE FROM opdracht WHERE OpdrachtID = ?',id).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/statuses', function(req, res, next) {
	database.query('SELECT * FROM opdracht_status').then(rows => { 
		console.log(rows);
		res.send(JSON.stringify(rows));
	});
});


router.get('/:id', function(req, res, next) {
	var id = req.params.id;
	let assignments;
	database.query("SELECT * FROM (SELECT * FROM opdracht WHERE opdrachtID = ? ) AS o LEFT JOIN opdracht_status ON o.opdrachtstatusid = opdracht_status.OpdrachtSID LEFT JOIN bedrijf ON o.bedrijfid = bedrijf.BedrijfID", id).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.post('/update/:id',upload.single('opdrachtAfbeelding'), function(req, res, next) {
	var id = req.params.id;
	var body = req.body;
	console.log(body);
	if(req.file != undefined){
		database.query("UPDATE opdracht SET titel = ?, beschrijving = ?, ec = ?, opdrachtstatusid = ?, opdrachtafbeelding = ? WHERE OpdrachtID = ?", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, req.file.path, id]).then(rows => { 
			res.send(JSON.stringify(rows));
		});
	}
	else{
		database.query("UPDATE opdracht SET titel = ?, beschrijving = ?, ec = ?, opdrachtstatusid = ? WHERE OpdrachtID = ?", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, id]).then(rows => { 
			res.send(JSON.stringify(rows));
		});
	}
});

router.post('/post', upload.single('opdrachtAfbeelding'),function(req, res, next) {
	var body = req.body;
	console.log(req.file);
	console.log(body);
	database.query("INSERT INTO opdracht (titel, beschrijving, ec, opdrachtstatusid, bedrijfid, opdrachtAfbeelding) VALUES (?,?,?,?,?,?)", [body.titel, body.beschrijving, body.ec, body.opdrachtstatusid, body.bedrijfid, req.file.path]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.post('/uploadimage/:id', upload.single('opdrachtAfbeelding'),function(req, res, next) {
	var id = req.params.id;
	database.query("INSERT INTO opdracht_afbeelding (pad, opdrachtid) VALUES (?,?)", [req.file.path, id]).then(rows => { 
		res.send(JSON.stringify(rows));
	});
});

router.get('/deleteimage/:id', function(req, res, next) {
	var id = req.params.id;
	database.query("SELECT pad FROM opdracht_afbeelding WHERE OpdrachtAfbeeldingID = ?", [id]).then(rows => {
		fs.unlink(path.resolve(rows[0].pad));
		return database.query("DELETE FROM opdracht_afbeelding WHERE OpdrachtAfbeeldingID = ?", [id]);
	}).then(rows =>{
		res.send(JSON.stringify(rows));
	});
	
});

function getImagePath(itemId, imageId) {
    var filePath = uploadDir + itemId + '_' + imageId;
    return path.resolve(filePath);
}



module.exports = router;

// get status and company for an array of assignments
// async function processAssignments(array){
// 	let assignments = [];
// 	for	(const item of array){
// 		let assignment;
// 		await database.query('SELECT * FROM opdracht_status WHERE ID = ?', item.statusID).then(row => {
// 			item.status = row;
// 			return database.query('SELECT * FROM bedrijf WHERE ID = ?', item.bedrijfID);
// 		}).then(row => {
// 			item.bedrijf = row;
// 			assignment = item;
// 			assignments.push(assignment);
// 		});
// 	}
// 	return assignments;
// }
