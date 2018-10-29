// sounds-router.js
// node.js + express router for RESTful API at /api/sounds
'use strict';

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

const soundsRepository = require('../models/sounds-repository');

// All methods in this router respond in the same way,
// so bringing the code together in a single function.
function respond(res, result, error, status) {
    if (error) {
        status = typeof status === 'number' ? status : 500;
        res.status(status).send({message: error});
    } else {
        res.send(result);
    }
}

// GET /api/sounds
// Enumerate all sounds
router.get('/', function(req, res) {
    soundsRepository.getAll(function(result, error, status) {
        respond(res, result, error, status);
    });
});

// GET /api/sounds/id
// Get a sound by id
router.get('/:id', function(req, res) {
    soundsRepository.get(req.params.id, function(result, error, status) {
        respond(res, result, error, status);
    });
});

// PUT /api/sounds/id
// Normally a PUT would update the object, but for our purposes it simply
// acts as a trigger to play the sound on the device. No status change
// is made to the data.
router.put('/:id', function(req, res) {
    soundsRepository.play(req.params.id, req.app.pumpkinData, function(result, error, status) {
        respond(res, result, error, status);
    });
});

module.exports = router;
