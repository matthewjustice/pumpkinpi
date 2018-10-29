// default-router.js
// node.js + express router for serving pages
'use strict';

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

// GET the home page
router.get('/', function(req, res) {
    res.render('index');
});

module.exports = router;
