// pumpkinpi.js - The client-side JavaScript code for the Pumpkin Pi app.
// No frameworks used, just JavaScript DOM manipulation.
// All code is encloded in a self-executing anonymous function, 
// so everything is private and doesn't pollute the global namespace.

"use strict";

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Add sound data to select box
        addSoundsToMenu(document.getElementById('sounds-select'));

        // Show initial status
        getLedsStatus();
        getFeatureStatus();

        // Bind event handlers
        document.getElementById('play-button').onclick = playSound;

        document.getElementById('led1-checkbox').onclick = function() { 
            ledChecked('led1', document.getElementById('led1-checkbox')) 
        };

        document.getElementById('led2-checkbox').onclick = function() { 
            ledChecked('led2', document.getElementById('led2-checkbox')) 
        };

        document.getElementById('motion-sensor-checkbox').onclick = function() { 
            featureChecked('motion-sensor', document.getElementById('motion-sensor-checkbox')) 
        };
        
        // Event handlers for socket.io
        var socket = io();
        socket.on('feature-update', onFeatureUpdate);
        socket.on('led-update', onLedUpdate);
    });

    // Status object
    var serverStatus = {};

    //
    // LED stuff
    //
    function ledChecked(ledId, checkbox) {
        console.log('ledChecked ' + ledId + ' ' + checkbox.checked);
        if(serverStatus[ledId] != checkbox.checked) {
            // The server-reported status doesn't match the UI.
            // This likely means this check event happened as 
            // the result a user-invoked UI change, 
            // not a socket.io change to the UI. Since the user
            // is requesting a state change, send the request.
            if(checkbox.checked) {
                updateLed(ledId, 'on');
            }
            else {
                updateLed(ledId, 'off');
            }
        }
    }
    function updateLed(ledId, status) {
        var apiUrl = '/api/leds/' + ledId;
        console.log('PUT ' + apiUrl);

        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({status: status})
        })
        .catch(function(error){
            console.log('Error while updating LED: ' + error.message);
        });
    }

    function setLedStatus(led) {
        serverStatus[led.id] = (led.status === 'on');
        var elementId = led.id + '-checkbox';
        document.getElementById(elementId).checked = (led.status === 'on');
    }

    function getLedsStatus() {
        var apiUrl = '/api/leds';
        console.log('GET ' + apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                return response.json();
            })
            .then(function(leds) {
                console.log('leds: ' + JSON.stringify(leds));

                // Update status of LED1 and LED2
                for(var i = 0, length = leds.length; i < length; i++)
                {
                    var led = leds[i];
                    if(led.id === 'led1' || led.id == 'led2')
                    {
                        setLedStatus(led);
                    }
                }
            })
            .catch(function(error){
                console.log('Error while getting leds: ' + error.message);
            });
    }

    //
    // Feature stuff
    //
    function featureChecked(featureId, checkbox) {
        console.log('featureChecked ' + featureId + ' ' + checkbox.checked);
        if(serverStatus[featureId] != checkbox.checked) {
            // The server-reported status doesn't match the UI.
            // This likely means this check event happened as 
            // the result a user-invoked UI change, 
            // not a socket.io change to the UI. Since the user
            // is requesting a state change, send the request.
            if(checkbox.checked) {
                updateFeature(featureId, true);
            }
            else {
                updateFeature(featureId, false);
            }
        }
    }

    function updateFeature(featureId, enabled) {
        var apiUrl = '/api/features/' + featureId;
        console.log('PUT ' + apiUrl);

        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({enabled: enabled})
        })
        .catch(function(error){
            console.log('Error while updating feature: ' + error.message);
        });
    }
    
    function setFeatureStatus(feature) {
        serverStatus[feature.id] = feature.enabled;
        var elementId = feature.id + '-checkbox';
        document.getElementById(elementId).checked = feature.enabled;
    }

    function getFeatureStatus() {
        var apiUrl = '/api/features';
        console.log('GET ' + apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                return response.json();
            })
            .then(function(features) {
                console.log('features: ' + JSON.stringify(features));

                // Update status of the motion sensor feature
                for(var i = 0, length = features.length; i < length; i++)
                {
                    var feature = features[i];
                    if(feature.id === 'motion-sensor')
                    {
                        setFeatureStatus(feature);
                    }
                }
            })
            .catch(function(error){
                console.log('Error while getting leds: ' + error.message);
            });
    }

    //
    // Sound stuff
    //
    function playSound() {
        // Get the selected sound id
        var select = document.getElementById("sounds-select");
        var options = select.options;
        if(options.selectedIndex == -1) {
            // Early exit if no sound is selected.
            return;
        }

        // Playing a sound requires a PUT to the resource.
        // No body is included because the state of the object
        // on the server is not modified.
        var soundId = options[options.selectedIndex].value;
        var apiUrl = '/api/sounds/' + soundId;
        console.log('PUT ' + apiUrl);

        fetch(apiUrl, { 
            method: 'PUT' 
        })
        .catch(function(error){
            console.log('Error while playing sound: ' + error.message);
        });
    }

    function addSoundsToMenu(selectBox) {
        var apiUrl = '/api/sounds';
        console.log('GET ' + apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                return response.json();
            })
            .then(function(sounds) {
                console.log('sounds: ' + JSON.stringify(sounds));
                // Add each element to the select box
                for(var i = 0, length = sounds.length; i < length; i++)
                {
                    console.log("Adding " + sounds[i].id);
                    let option = document.createElement('option');
                    option.value = sounds[i].id;
                    option.innerHTML = sounds[i].title;
                    selectBox.appendChild(option);
                }
            })
            .catch(function(error){
                console.log('Error while getting sounds: ' + error.message);
            });
    }

    //
    // Socket.io stuff
    //
    function onFeatureUpdate(feature) {
        console.log('feature-update: ' + JSON.stringify(feature));
        if(feature.id === 'motion-sensor')
        {
            setFeatureStatus(feature);
        }
    }

    function onLedUpdate(led) {
        console.log('led-update: ' + JSON.stringify(led));
        if(led.id === 'led1' || led.id == 'led2')
        {
            setLedStatus(led);
        }
    }

}());
