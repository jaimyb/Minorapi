var express = require('express');
var router = express.Router();

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
	global.connection.query('SELECT * from bedrijf WHERE BedrijfID = ?',[id], function (error, results, fields) {
          res.send(JSON.stringify(results));
          console.log(results);
    });
});

router.get('/', function(req, res, next) {
    
});

module.exports = router;