// sounds-repository.js
// Defines the sounds repository object model for accessing the sound data 
// initially stored in a JSON file - sounds.json,
// that defines our sound data as a dictionary of string id to sound object
// 
// All repository functions take a callback function:
//     done (result, error, status)
//           result = the data to return, if any
//           error  = any error string, if any
//           status = the numeric http status code, if any

// private
var soundsData = require("../data/sounds.json");
const { execFile } = require('child_process');

// public
var soundsRepositoryPublic = {
    
    // Get all the sounds as an array of sound objects
    getAll: function (done) {
        // flatten dictionary to array
        // and add derived properties
        var soundArray = [];
        for (var id in soundsData) {
            if (soundsData.hasOwnProperty(id)) {
                var sound = soundsData[id];
                sound.id = id;
                soundArray.push(sound);
            }
        }
        done(soundArray);
    },
    
    // Get a single sound by id
    get: function (id, done) {
        try {
            var sound = soundsData[id.toLowerCase()];
            if (sound) {
                // Add derived properties
                sound.id = id;
                done(sound);
            } else {
                done(null, "sound " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    },

    // Play a single sound by id
    play: function (id, pumpkinData, done)
    {
        try {
            var sound = soundsData[id.toLowerCase()];
            if (sound) {
                // Add derived properties
                sound.id = id;

                // Play the sound on the server hardware
                let fullPath = pumpkinData.soundsDirectory + '/' + sound.id;
                console.log('Playing sound ' + fullPath);
                execFile('aplay', [fullPath]);
                done(sound);
            } else {
                done(null, "sound " + id + " does not exist", 404);
            }
        }
        catch (err) {
            done(null, err, 500);
        }
    }
}

module.exports = soundsRepositoryPublic;