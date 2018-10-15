// features-repository.js
// Defines the feature repository object model for accessing the feature data 
// initially stored in a JSON file - features.json,
// that defines our feature data as a dictionary of string id to feature object
// 
// All repository functions take a callback function:
//     done (result, error, status)
//           result = the data to return, if any
//           error  = any error string, if any
//           status = the numeric http status code, if any

// private
var featuresData = require("../data/features.json");

// public
var featuresRepositoryPublic = {
    
    // Get all the features as an array of feature objects
    getAll: function (done) {
        // flatten dictionary to array
        // and add derived properties
        var featureArray = [];
        for (var id in featuresData) {
            if (featuresData.hasOwnProperty(id)) {
                var feature = featuresData[id];
                feature.id = id;
                featureArray.push(feature);
            }
        }
        done(featureArray);
    },
    
    // Get a single feature by id
    get: function (id, done) {
        try {
            var feature = featuresData[id.toLowerCase()];
            if (feature) {
                // Add derived properties
                feature.id = id;
                done(feature);
            } else {
                done(null, "feature " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    },

    // Update a single feature by id
    update: function (id, updatedfeature, pumpkinData, io, done)
    {
        try {
            var feature = featuresData[id.toLowerCase()];
            if (feature) {
                // Add derived properties
                feature.id = id;

                // Currently only motion-sensor supports the enabled property
                if(updatedfeature.hasOwnProperty('enabled')) {
                    // update details (only allow boolean values)
                    if(updatedfeature.enabled) {
                        feature.enabled = true;
                    } else {
                        feature.enabled = false;
                    }

                    // Update pumpkin data
                    var pumpkinProperty = id + '-enabled';
                    if(pumpkinData.hasOwnProperty(pumpkinProperty)) {
                        pumpkinData[pumpkinProperty] = feature.enabled;
                        io.sockets.emit('feature-update', feature);
                        console.log('Update feature: ' + pumpkinProperty + ' is ' + feature.enabled);
                    }
                }

                // Currently only webcam supports the enabled property
                if(updatedfeature.hasOwnProperty('brightness')) {
                    let pumpkinProperty = id + '-brightness';
                    let brightInt;
                    let validInput = false;

                    if(updatedfeature.brightness === 'auto-toggle') {
                        pumpkinData[pumpkinProperty] = 'auto-toggle';
                        feature.brightness = 'auto-toggle';
                        console.log('set brightness to auto-toggle');
                        validInput = true;
                    }
                    else if((brightInt = parseInt(updatedfeature.brightness)) != NaN) {
                        pumpkinData[pumpkinProperty] = brightInt;
                        feature.brightness = brightInt;
                        console.log('set brightness to ' + brightInt);
                        validInput = true;
                    }
                    else {
                        console.log(updatedfeature.brightness + ' is not a valid brightness value');
                    }

                    if(validInput) {
                        io.sockets.emit('feature-update', feature);
                    }
                }

                done(feature);
            } else {
                done(null, "feature " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    }
}

module.exports = featuresRepositoryPublic;