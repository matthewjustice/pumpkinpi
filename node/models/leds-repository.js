// leds-repository.js
// Defines the LED repository object model for accessing the LED data 
// initially stored in a JSON file - leds.json,
// that defines our LED data as a dictionary of string id to LED object
// 
// All repository functions take a callback function:
//     done (result, error, status)
//           result = the data to return, if any
//           error  = any error string, if any
//           status = the numeric http status code, if any

// private
var ledsData = require("../data/leds.json");

// public
var ledsRepositoryPublic = {
    
    // Get all the leds as an array of led objects
    getAll: function (done) {
        // flatten dictionary to array
        // and add derived properties
        var ledArray = [];
        for (var id in ledsData) {
            if (ledsData.hasOwnProperty(id)) {
                var led = ledsData[id];
                led.id = id;
                ledArray.push(led);
            }
        }
        done(ledArray);
    },
    
    // Get a single led by id
    get: function (id, done) {
        try {
            var led = ledsData[id.toLowerCase()];
            if (led) {
                // Add derived properties
                led.id = id;
                done(led);
            } else {
                done(null, "led " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    },

    // Update a single led by id
    update: function (id, updatedLed, pumpkinData, io, done)
    {
        try {
            var led = ledsData[id.toLowerCase()];
            if (led) {
                // Add derived properties
                led.id = id;

                // update details (only allow update of status)
                if(updatedLed.status.toUpperCase() === "ON") {
                    led.status = "on";
                } else {
                    led.status = "off";
                }

                // Update hardware
                if(pumpkinData.hasOwnProperty(id)) {
                    pumpkinData[id].writeSync(led.status == "off" ? 0 : 1)
                }

                io.sockets.emit('led-update', led);

                done(led);
            } else {
                done(null, "led " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    }
}

module.exports = ledsRepositoryPublic;