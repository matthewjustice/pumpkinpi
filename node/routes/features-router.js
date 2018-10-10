// features-router.js
// node.js + express router for RESTful API at /api/features

var express = require('express');
var router = express.Router();

var featuresRepository = require('../models/features-repository');

// All methods in this router respond in the same way,
// so bringing the code together in a single function. 
function respond(res, result, error, status) {
    if (error) {
        status = typeof status === 'number' ? status : 500;
        res.status(status).send({ message: error });
    } else {
        res.send(result);
    }
}

// The module exports a function so that 
// we can have a parameter of 'io' for socket.io
module.exports = function(io) {
    // GET /api/features
    // Enumerate all features
    router.get("/", function (req, res) {
        featuresRepository.getAll(function (result, error, status) {
            respond(res, result, error, status);
        });
    });

    // GET /api/features/id
    // Get a feature by id
    router.get('/:id', function (req, res) {
        featuresRepository.get(req.params.id, function (result, error, status) {
            respond(res, result, error, status);
        });
    });

    // PUT /api/features/id
    // Update a feature by id
    router.put('/:id', function (req, res) {
        featuresRepository.update(req.params.id, req.body, req.app.pumpkinData, io, function (result, error, status) {
            respond(res, result, error, status);
        });
    });

    return router;
}