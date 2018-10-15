// pumpkinpi.js - The client-side JavaScript code for the Pumpkin Pi app.
// No frameworks used, just JavaScript DOM manipulation.
// All code is encloded in a self-executing anonymous function, 
// so everything is private and doesn't pollute the global namespace.

"use strict";

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Add sound data to select box
        addSoundsToMenu(document.getElementById('sounds-select'));

        // Show latest image
        showLatestPhoto(document.getElementById('photo-image'));

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
            featureEnabledChecked('motion-sensor', document.getElementById('motion-sensor-checkbox')) 
        };

        document.getElementById('photo-button').onclick = capturePhoto;

        document.getElementById('brightness-slider').oninput = brightnessSliderChanged;

        document.getElementById('auto-brightness-checkbox').onclick = autoBrightnessChecked;
        
        // Event handlers for socket.io
        var socket = io();
        socket.on('feature-update', onFeatureUpdate);
        socket.on('led-update', onLedUpdate);
        socket.on('photo-update', onPhotoUpdate);
    });

    var brightnessTimerActive = false;
    var brightnessSliderValuesArray = [];

    //
    // LED stuff
    //
    function ledChecked(ledId, checkbox) {
        console.log('ledChecked ' + ledId + ' ' + checkbox.checked);
        if(checkbox.checked) {
            updateLed(ledId, 'on');
        }
        else {
            updateLed(ledId, 'off');
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
    function featureEnabledChecked(featureId, checkbox) {
        console.log('featureEnabledChecked ' + featureId + ' ' + checkbox.checked);
        if(checkbox.checked) {
            updateFeature(featureId, {enabled: true});
        }
        else {
            updateFeature(featureId, {enabled: false});
        }
    }

    function updateFeature(featureId, data) {
        var apiUrl = '/api/features/' + featureId;
        console.log('PUT ' + apiUrl);

        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .catch(function(error){
            console.log('Error while updating feature: ' + error.message);
        });
    }
    
    function setClientFeatureBoolean(featureKey, value) {
        var elementId = featureKey + '-checkbox';
        document.getElementById(elementId).checked = value;
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
                        setClientFeatureBoolean(feature.id, feature.enabled);
                    }
                    else if(feature.id === 'webcam')
                    {
                        handleWebcamFeatureUpdate(feature);
                    }
                }
            })
            .catch(function(error){
                console.log('Error while getting features: ' + error.message);
            });
    }

    function brightnessSliderChanged() {
        // Update the UI integer value
        var brightnessValue = document.getElementById('brightness-value');
        brightnessValue.innerHTML = this.value;

        // The slider change event usually happens multiple times when 
        // a user moves the slider. To prevent hammering the server, we
        // just collect the values in an array, start a timer,
        // and after one second we'll post the last value collected.
        brightnessSliderValuesArray.push(this.value);

        if(!brightnessTimerActive) {
            brightnessTimerActive = true;
            setTimeout(() => {
                brightnessTimerActive = false;

                if(brightnessSliderValuesArray && brightnessSliderValuesArray.length > 0) {
                    var lastValue = brightnessSliderValuesArray[brightnessSliderValuesArray.length - 1];
                    // Update the server feature to the last value
                    updateFeature('webcam', {brightness: lastValue});
                    // Clear our array
                    brightnessSliderValuesArray.length = [];
                }
            }, 1000);
        }
    }

    function hideBrightnessSlider(hide) {
        var brightnessSlider = document.getElementById('brightness-slider');
        var brightnessValue = document.getElementById('brightness-value');

        // If auto brightness is checked, disable / hide the slider
        brightnessSlider.disabled = hide;
        brightnessSlider.style.visibility = hide ? 'hidden' : 'visible';
        brightnessValue.style.visibility = hide ? 'hidden' : 'visible';
    }

    function autoBrightnessChecked() {
        console.log('autoBrightnessChecked');

        // Show or hide the brightness slider
        hideBrightnessSlider(this.checked);

        // If checked, set the webcam value to auto-toggle, 
        // otherwise set to the slider value.
        if (this.checked) {
            updateFeature('webcam', {brightness: 'auto-toggle'});
        }
        else {
            var brightnessValue = document.getElementById('brightness-value').innerHTML;
            updateFeature('webcam', {brightness: brightnessValue});
        }
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
    // Photos stuff
    //
    function capturePhoto() {
        var apiUrl = '/api/photos/'
        console.log('POST ' + apiUrl);

        fetch(apiUrl, { 
            method: 'POST' 
        })
        .catch(function(error){
            console.log('Error while capturing photo: ' + error.message);
        });
    }

    function showLatestPhoto(photoImage) {
        var apiUrl = '/api/photos/latest';
        console.log('GET ' + apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                if(!response.ok)
                {
                    var e = {};
                    e.message = response.statusText;
                    throw(e);
                }
                return response.json();
            })
            .then(function(photo) {
                console.log('latest photo: ' + JSON.stringify(photo));
                // Set the photo
                photoImage.src = photo.path;
            })
            .catch(function(error){
                console.log('Error while getting latest photo: ' + error.message);
            });
    }

    //
    // Socket.io stuff
    //
    function onFeatureUpdate(feature) {
        console.log('feature-update: ' + JSON.stringify(feature));
        if(feature.id === 'motion-sensor') {
            setClientFeatureBoolean(feature.id, feature.enabled);
        }
        else if(feature.id === 'webcam') {
            handleWebcamFeatureUpdate(feature);
        }
    }

    function handleWebcamFeatureUpdate(feature) {
        var brightInt;
        // Set the client boolean state (which controls the checkbox)
        // to true if the brightness value is 'auto-toggle'
        if(feature.brightness === 'auto-toggle') {
            // Check the auto box and hide the slider
            setClientFeatureBoolean('auto-brightness', true);
            hideBrightnessSlider(true);
        }
        else if((brightInt = parseInt(feature.brightness)) != NaN) {
            // Ensure valid range
            if(brightInt > 100) {
                brightInt = 100;
            }
            else if(brightInt < 0) {
                brightInt = 0;
            }

            // Turn off the auto checkbox
            setClientFeatureBoolean('auto-brightness', false);

            // Set slider values
            document.getElementById('brightness-slider').value = brightInt;
            document.getElementById('brightness-value').innerHTML = brightInt;

            // Show the slider
            hideBrightnessSlider(false);
        }
        else {
            console.log(updatedfeature.brightness + ' is an invalid brightness value.');
        }
    }

    function onLedUpdate(led) {
        console.log('led-update: ' + JSON.stringify(led));
        if(led.id === 'led1' || led.id == 'led2') {
            setLedStatus(led);
        }
    }

    function onPhotoUpdate(photo) {
        console.log('photo-update: ' + JSON.stringify(photo));
        var img = document.getElementById('photo-image');
        img.src = photo.path;
    }

}());
