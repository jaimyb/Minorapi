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
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');


let database = new Database();

const transporter = nodemailer.createTransport({
    host: 'DebugMail.io',
    port: 25,
    auth: {
        user: 'jbyourown@gmail.com',
        pass: 'b0369de0-7964-11e8-aa8a-e32fd7f7e4f2'
    }
});



router.post('/signup/student', function (req, res, next) {
    if (!req.body.email || !req.body.password) {
        console.log(req.body);
        res.json({ success: false, msg: 'Please pass name and password.' });
    }
    else {
        var newUser = { email: req.body.email, password: req.body.password };
        bcrypt.hash(newUser.password, 10, function (err, hash) {
            database.query("INSERT INTO gebruiker (email, wachtwoord) VALUES (?,?)", [req.body.email, hash]).then(rows => {
                return database.query("INSERT INTO student (voornaam, achternaam, studentemail) VALUES (?,?,?)", [req.body.voornaam, req.body.achternaam, req.body.email]);
            }).then(rows => {
                console.log(rows);
                return database.query("UPDATE gebruiker SET studentid = ? WHERE email = ?", [rows.insertId, req.body.email]);
            }).then(rows => {
                res.send(JSON.stringify({ success: true, msg: 'U heeft zichzelf succesvol aangemeld' }));
            }).catch(err => {
                if (err.errno == 1062) {
                    res.send(JSON.stringify({ success: false, msg: 'Email is al geregistreerd' }));
                }
            });
        });
    }
});

router.post('/signup/company', function (req, res, next) {
    if (!req.body.email || !req.body.password) {
        console.log(req.body);
        res.json({ success: false, msg: 'Please pass name and password.' });
    }
    else {
        console.log(req.body);
        var newUser = { email: req.body.email, password: req.body.password };
        bcrypt.hash(newUser.password, 10, function (err, hash) {
            database.query("INSERT INTO gebruiker (email, wachtwoord) VALUES (?,?)", [req.body.email, hash]).then(rows => {
                return database.query("INSERT INTO bedrijf (bedrijfnaam, bedrijfemail, telefoonnummer) VALUES (?,?,?)", [req.body.bedrijfnaam, req.body.email, req.body.telefoonnummer]);
            }).then(rows => {
                console.log(rows);
                return database.query("UPDATE gebruiker SET bedrijfid = ? WHERE email = ?", [rows.insertId, req.body.email]);
            }).then(rows => {
                res.send(JSON.stringify({ success: true, msg: 'U heeft zichzelf succesvol aangemeld' }));
            }).catch(err => {
                if (err.errno == 1062) {
                    res.send(JSON.stringify({ success: false, msg: 'Email is al geregistreerd' }));
                }
            });
        });
    }
});

router.post('/authenticate', function (req, res, next) {
    if (!req.body.email || !req.body.password) {
        res.json({ success: false, msg: 'Please pass name and password.' });
    }
    else {
        database.query("SELECT * FROM gebruiker WHERE email = ?", [req.body.email]).then(rows => {
            console.log(req.body.password + rows[0].wachtwoord);
            bcrypt.compare(req.body.password, rows[0].wachtwoord, function (err, result) {
                if (result) {
                    let roles = [];
                    if (rows[0].studentid !== null) {
                        roles.push('student');
                    }
                    if (rows[0].bedrijfid !== null) {
                        roles.push('bedrijf');
                    }
                    if (rows[0].coordinatorid !== null) {
                        roles.push('coordinator');
                    }
                    fs.readFile(path.resolve("bin/secret.txt"), 'utf8', function (err, data) {
                        console.log(data);
                        var token = jwt.sign({ email: rows[0].email, studentid: rows[0].studentid, bedrijfid: rows[0].bedrijfid, coordinatorid: rows[0].coordinatorid, roles: roles }, data, { expiresIn: 86400 });
                        res.send(JSON.stringify({ success: true, email: rows[0].email, token: token }));
                    });
                } else {
                    res.send(JSON.stringify({ success: false, msg: 'Wachtwoord komt niet overeen' }));
                }
            });
        });
    }
});


router.post('/authenticatejwt', function (req, res, next) {
    console.log(req.body.token);
    req.headers
    if (!req.body.token) {
        res.json({ success: false, msg: 'Please pass jwttoken' });
    }
    else {
        var token = req.body.token;
        fs.readFile(path.resolve("bin/secret.txt"), 'utf8', function (err, data) {
            jwt.verify(token, data, function (err, decoded) {
                console.log(data);
                if (!err) {
                    res.send(JSON.stringify({ success: true, msg: "Access granted" }));
                } else {
                    res.send(err);
                }
            });
        });
    }
});

router.post('/getcompanycode', function (req, res, next) {
    let code = randomstring.generate(20);
    let mailOptions = {
        from: 'jbyourown@gmail.com',
        to: req.body.email,
        subject: 'Registreren bedrijf',
        text: 'Met deze link kunt u eenmalig een account registreren: ' + 'http://localhost:4200/bedrijfregistreren/' + code
    };
    database.query("INSERT INTO bedrijfcode (Code) VALUES (?)", [code]).then(rows => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.send(JSON.stringify({ success: false, result: "Fout bij het verzenden van de code!" }));
            } else {
                res.send(JSON.stringify({ success: true, result: "Code succesvol verzonden!" }));
            }
        });
    }).catch(err => {
        res.send(JSON.stringify({ success: false, result: "Er is een onbekende fout opgetreden!" }));
    });
});

router.post('/checkcompanycode', function (req, res, next) {
    if (!req.body.code) {
        res.json({ success: false, msg: 'Code is niet meegeleverd!' });
    }
    else {
        database.query("SELECT geldig FROM bedrijfcode WHERE Code = ?", [req.body.code]).then(rows => {
            console.log(rows);
            if (rows[0].geldig == 1) {
                res.send(JSON.stringify({ success: true, result: "Code is geldig" }));
            }
            else {
                res.send(JSON.stringify({ success: false, result: "Code is ongeldig of reeds gebruikt!" }));
            }
        }).catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false, result: "Er is een onbekende fout opgetreden!" }));
        });
    }
});

router.post('/updatecompanycode', function (req, res, next) {
    if (!req.body.code) {
        res.json({ success: false, msg: 'Code is niet meegeleverd!' });
    }
    else {
        database.query("UPDATE bedrijfcode SET geldig = 0 WHERE Code = ?", [req.body.code]).then(rows => {
            res.send(JSON.stringify({ success: true, result: "Code is verbruikt" }));
        }).catch(err => {
            res.send(JSON.stringify({ success: false, result: "Er is een onbekende fout opgetreden!" }));
        });
    }
});

router.post('/sendrecoverycode', function (req, res, next) {
    let code = randomstring.generate(20);
    let mailOptions = {
        from: 'jbyourown@gmail.com',
        to: req.body.email,
        subject: 'Wachtwoord herstellen',
        text: 'Hierbij uw code om eenmalig uw wachtwoord te herstellen: ' + 'http://localhost:4200/wachtwoordherstellen/' + req.body.email + '/' + code
    };
    database.query("INSERT INTO wachtwoordcode (gebruikeremail, code) VALUES (?,?)", [req.body.email, code]).then(rows => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.send(JSON.stringify({ success: false, result: "Fout bij het verzenden van de code!" }));
            } else {
                res.send(JSON.stringify({ success: true, result: "Code succesvol verzonden!" }));
            }
        });
    }).catch(err => {
        console.log(err);
        res.send(JSON.stringify({ success: false, result: "Deze email is niet geregistreed!" }));
    });
});

router.post('/resetpassword', function (req, res, next) {
    if (!req.body.password) {
        res.json({ success: false, msg: 'Geen wachtwoord ingevoerd!' });
    }
    else {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            database.query("UPDATE gebruiker SET wachtwoord = ? WHERE email = ?", [hash, req.body.email]).then(rows => {
                return database.query("UPDATE wachtwoordcode SET geldig = 0 WHERE gebruikeremail = ?", [req.body.email]);
            }).then(rows => {
                res.send(JSON.stringify({ success: true, result: "Wachtwoord herstelt!" }));
            }).catch(err => {
                console.log(err);
                res.send(JSON.stringify({ success: false, result: "Er is een onbekende fout opgetreden!" }));
            });
        });
    }
});

router.post('/checkrecovercode', function (req, res, next) {
    if (!req.body.code || !req.body.email) {
        res.json({ success: false, msg: 'Ongeldige gegevens' });
    }
    else {
        database.query("SELECT * FROM wachtwoordcode WHERE gebruikeremail = ? AND code = ? AND geldig = 1", [req.body.email, req.body.code]).then(rows => {
            if (rows.length > 0) {
                res.send(JSON.stringify({ success: true, result: "Code is geldig" }));
            }
            else {
                res.send(JSON.stringify({ success: false, result: "Code is ongeldig" }));
            }
        }).catch(err => {
            res.send(JSON.stringify({ success: false, result: "Er is een onbekende fout opgetreden!" }));
        });
    }
});

module.exports = router;
