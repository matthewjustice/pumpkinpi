// default-router.js
// node.js + express router for serving pages

var express = require('express');
var router = express.Router();

// GET the home page
router.get('/', function (req, res) {
    res.render('index');
});

module.exports = router;