// motion-sensor.js
// Defines the logic for how we interact with the motion sensor
'use strict';

// private
let soundsCounter = 0;
let sounds = null;
const soundsRepository = require('../models/sounds-repository');
const ledsRepository = require('../models/leds-repository');
const photosRepository = require('../models/photos-repository');

// Get all the sounds and save them to sounds array
soundsRepository.getAll(function(result, error, status) {
    if (!error) {
        sounds = result;
    }
});

// Play the next sound and update the counter
function playNextSound(pumpkinData) {
    if (sounds && sounds.length > 0) {
        soundsRepository.play(sounds[soundsCounter].id, pumpkinData, function(result, error, status) {
            console.log('Play sound ' + sounds[soundsCounter].id + ' complete.');
            console.log('   result = ' + JSON.stringify(result) + ' error = ' + error);
        });

        if (++soundsCounter === sounds.length) {
            soundsCounter = 0;
        }
    }
}

// public, defined as a function so the module
// export can take a parameter of pumpkinData
function motionSensorPublic(pumpkinData, io) {
    const sensor = {};
    sensor.callback = function() {
        // The expectation is that the motion sensor will
        // control, in hardware, how frequenlty this is triggered.
        // A HC-SR501 allows a setting of 5 seconds minimum
        // that the output is held high, so as long as this function
        // completes in 5 seconds or less we are OK.

        if (pumpkinData['motion-sensor-enabled']) {
            // Play a sound and update the counter for next time
            playNextSound(pumpkinData);

            // Turn LEDs on
            ledsRepository.updateAllLeds('on', pumpkinData, io, (result, error) => {
                console.log('LED ON result = ' + JSON.stringify(result) + ' error = ' + error);
            });

            // Set a timer to turn off the LEDs shortly.
            setTimeout(() => {
                ledsRepository.updateAllLeds('off', pumpkinData, io, (result, error) => {
                    console.log('LED OFF result = ' + JSON.stringify(result) + ' error = ' + error);
                });
            }, 2000);

            // Capture a photo
            photosRepository.capture(pumpkinData, io, false, (result, error) => {
                console.log('Photo capture result = ' + JSON.stringify(result) + ' error = ' + error);
            });
        }
    };

    return sensor;
}

module.exports = motionSensorPublic;
