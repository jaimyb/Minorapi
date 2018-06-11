const express = require('express');
const router = express.Router();
const Promise = require('promise');
const Database = require('../database.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supersecretcode = 'memegarageontour';


let database = new Database();

router.post('/signup/student', function(req, res, next) {
	if (!req.body.email || !req.body.password) {
        console.log(req.body);
        res.json({success: false, msg: 'Please pass name and password.'});
    }
    else{
        var newUser = { email: req.body.email, password: req.body.password };
        bcrypt.hash(newUser.password, 10, function (err, hash) {
            database.query("INSERT INTO gebruiker (email, wachtwoord) VALUES (?,?)", [req.body.email, hash]).then(rows => { 
                return database.query("INSERT INTO student (voornaam, achternaam, studentnummer, klas, studentemail) VALUES (?,?,?,?,?)", [req.body.voornaam, req.body.achternaam, req.body.studentnummer, req.body.klas, req.body.email]);    
            }).then(rows => {
                return database.query("UPDATE gebruiker SET studentid = ? WHERE email = ?", [rows.insertId, req.body.email]);
            }).then(rows => {
                res.send(JSON.stringify({success: true, msg: 'U heeft zichzelf succesvol aangemeld'}));
            }).catch(err =>{
                if(err.errno == 1062){
                    res.send(JSON.stringify({success: false, msg: 'Email is al geregistreerd'}));
                }
            });
        });
    }
});

router.post('/authenticate', function(req, res, next) {
	if (!req.body.email || !req.body.password) {
        res.json({success: false, msg: 'Please pass name and password.'});
    }
    else{
        database.query("SELECT * FROM gebruiker WHERE email = ?", [req.body.email]).then(rows => {
            console.log(req.body.password + rows[0].wachtwoord); 
            bcrypt.compare(req.body.password, rows[0].wachtwoord, function(err, result) {
                if(result) {
                    let roles = [];
                    if(rows[0].studentid !== null){
                        roles.push('student');
                    }
                    if(rows[0].bedrijfid !== null){
                        roles.push('bedrijf');
                    }
                    if(rows[0].coordinatorid !== null){
                        roles.push('coordinator');
                    }
                    console.log(roles);
                    var token = jwt.sign({email: rows[0].email, studentid: rows[0].studentid, bedrijfid: rows[0].bedrijfid, coordinatorid: rows[0].coordinatorid, roles: roles}, supersecretcode,{expiresIn: 86400});
                    res.send(JSON.stringify({success: true, email: rows[0].email, token: token}));
                } else {
                    res.send(JSON.stringify({success: false, msg: 'Wachtwoord komt niet overeen'}));
                } 
            });
        });
    }
});

// router.post('/authenticatejwt', function(req, res, next) {
// 	if (!req.header("jwt")) {
//         res.json({success: false, msg: 'Please pass jwttoken'});
//     }
//     else{
//         var token = req.header("jwt");
//         console.log("HELLLOOOOOoo" + token);
//         jwt.verify(token, supersecretcode, function(err, decoded){
//             if(!err){
//                 res.send(JSON.stringify({success: true, msg: "Access granted"}));
//             } else {
//             res.send(err);
//             }
//         });
//     }
// });

router.post('/authenticatejwt', function(req, res, next) {
    console.log(req.body.token);
    if (!req.body.token) {
        res.json({success: false, msg: 'Please pass jwttoken'});
    }
    else{
        var token = req.body.token;
        jwt.verify(token, supersecretcode, function(err, decoded){
            if(!err){
                res.send(JSON.stringify({success: true, msg: "Access granted"}));
            } else {
            res.send(err);
            }
        });
    }
});

module.exports = router;
