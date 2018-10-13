// motion-sensor.js
// Defines the logic for how we interact with the motion sensor

// private
var soundsCounter = 0;
var sounds = null;
var leds = null;
var soundsRepository = require('../models/sounds-repository');
var ledsRepository = require('../models/leds-repository');
var photosRepository = require('../models/photos-repository');

// Get all the sounds and save them to sounds array
soundsRepository.getAll(function (result, error, status) {
    if(!error) {
        sounds = result;
    }
});

// Get all the leds and save them to leds array
ledsRepository.getAll(function (result, error, status) {
    if(!error) {
        leds = result;
    }
});

// Play the next sound and update the counter
function playNextSound(pumpkinData) {
    if(sounds && sounds.length > 0)
    {
        soundsRepository.play(sounds[soundsCounter].id, pumpkinData, function (result, error, status) {
            console.log('Play sound ' + sounds[soundsCounter].id + ' complete.');
            console.log('   result = ' + JSON.stringify(result) + ' error = ' + error);
        });

        if(++soundsCounter === sounds.length) {
            soundsCounter = 0;
        }
    }
}

// Update all the LEDs, status is either 'on' or 'off'
function updateAllLeds(status, pumpkinData, io) {
    if(leds && leds.length > 0)
    {
        for(var i = 0, length = leds.length; i < length; i++)
        {
            ledsRepository.update(leds[i].id, {status: status}, pumpkinData, io, function (result, error, status) {
                console.log('LED ON ' + leds[i].id + ' complete.');
                console.log('   result = ' + JSON.stringify(result) + ' error = ' + error);
            });
        }
    }
}

// public, defined as a function so the module 
// export can take a parameter of pumpkinData
function motionSensorPublic(pumpkinData, io) {
    var sensor = {};
    sensor.callback = function() {
        // The expectation is that the motion sensor will
        // control, in hardware, how frequenlty this is triggered.
        // A HC-SR501 allows a setting of 5 seconds minimum
        // that the output is held high, so as long as this function
        // completes in 5 seconds or less we are OK.

        if(pumpkinData['motion-sensor-enabled']) {
            // Play a sound and update the counter for next time
            playNextSound(pumpkinData);

            // Turn LEDs on
            updateAllLeds('on', pumpkinData, io);

            // Capture a photo
            photosRepository.capture(pumpkinData, io, (result, error) => {
                console.log('Photo capture result = ' + JSON.stringify(result) + ' error = ' + error);
            });

            // Set a timer to turn off the LEDs shortly.
            setTimeout(() => {
                updateAllLeds('off', pumpkinData, io);
            }, 2000);
        }
    };

    return sensor;
}

module.exports = motionSensorPublic;