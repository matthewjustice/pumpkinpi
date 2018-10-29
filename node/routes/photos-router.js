// photos-router.js
// node.js + express router for RESTful API at /api/photos
'use strict';

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

const photosRepository = require('../models/photos-repository');

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

// GET /api/photos
// Enumerate all photos
router.get('/', function(req, res) {
    photosRepository.getAll(req.app.pumpkinData, req.query.sortOrder, function(result, error, status) {
        respond(res, result, error, status);
    });
});

// GET /api/photos/id
// Get a photo by id
router.get('/:id', function(req, res) {
    // Special case, if the id is the string 'latest', ask for the latest file
    if (req.params.id === 'latest') {
        photosRepository.getLatest(req.app.pumpkinData, function(result, error, status) {
            respond(res, result, error, status);
        });
    } else {
        photosRepository.get(req.params.id, req.app.pumpkinData, function(result, error, status) {
            respond(res, result, error, status);
        });
    }
});

// POST /api/photos
// Requests that a photo be captured on the Pumpkin Pi.
router.post('/', function(req, res) {
    photosRepository.capture(req.app.pumpkinData, req.app.io, function(result, error, status) {
        respond(res, result, error, status);
    });
});

module.exports = router;
