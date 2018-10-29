// photos-repository.js
// Defines the photos repository object model for accessing the photos data
// stored on the file system.
//
// All repository functions take a callback function:
//     done (result, error, status)
//           result = the data to return, if any
//           error  = any error string, if any
//           status = the numeric http status code, if any
'use strict';

// private
const {execFile} = require('child_process');
const fs = require('fs');
const path = require('path');
const pathUrlPrefix = '/photos/';
const soundsRepository = require('../models/sounds-repository');
const ledsRepository = require('../models/leds-repository');

let autoToggleBrightnessValue = 0;

// Normally, fswebcam should be set to 'fswebcam'.
const fswebcam = 'fswebcam';
// For testing purposes, use this:
// const fswebcam = 'touch';

// Returns the appropriate args for fswebcam
function getWebcamArgs(pumpkinData, filename) {
    const args = ['-S', '2', '--banner-colour=#FF6A00', '--line-colour=#007F0E', '--set'];
    const webcamBrightness = pumpkinData['webcam-brightness'];
    let brightInt;

    // Determine the brightness
    if (webcamBrightness === 'auto-toggle') {
        // There's a problem with some webcams where the brightness gets
        // a bit brighter or darker with each capture. A workaround is
        // to toggle the brightness between 0% and 100% on every photo.
        args.push('brightness=' + autoToggleBrightnessValue + '%');

        // Toggle
        if (autoToggleBrightnessValue == 0) {
            autoToggleBrightnessValue = 100;
        } else {
            autoToggleBrightnessValue = 0;
        }
    } else if (brightInt = parseInt(webcamBrightness)) {
        args.push('brightness=' + brightInt + '%');
    } else {
        args.push('brightness=50%');
    }

    // Always add the filename to the end
    args.push(filename);
    console.log('getWebcamArgs() - args are: ' + args.toString().replace(/,/gi, ' '));

    // For testing purposes, use this:
    // args = [];
    return args;
}

// Converts a filename to a photo object if it isn't a directory.
// This function can throw if the file can't be accessed.
function fileNameToPhoto(filename, photosDirectory) {
    // Make sure this is a file and not a directory.
    const fullPath = path.join(photosDirectory, filename);
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
        const photo = {};
        photo.id = filename;
        photo.path = path.join(pathUrlPrefix, filename);
        return photo;
    } else {
        return null;
    }
}

// Wrapper for fileNameToPhoto with done callback
function tryFileToPhoto(filename, photosDirectory, capture, done) {
    try {
        const photo = fileNameToPhoto(filename, photosDirectory);
        if (photo) {
            done(photo);
        } else {
            done(null, 'invalid photo', 404);
        }
    } catch (err) {
        // The err object thrown by fs.statSync contains the
        // full path to the file. We don't want to return that,
        // so swallow the error details.
        if (capture) {
            done(null, 'unable to capture photo', 500);
        } else if (err.code = 'ENOENT') {
            done(null, 'photo ' + filename + ' does not exist', 404);
        } else {
            done(null, 'unable to access photo ' + filename, 500);
        }
    }
}

// Generates a new filename
function newPhotoFileName() {
    const date = new Date(Date.now());
    let filename = date.toISOString(); // returns YYYY-MM-DDTHH:mm:ss.sssZ
    filename = filename.replace(/:/gi, '-');
    return filename + '.jpg';
}

function getAllPhotoFilenames(pumpkinData, sortOrder, complete) {
    fs.readdir(pumpkinData.photosDirectory, (err, files) => {
        if (err) {
            complete(null);
        } else {
            if (!files || files.length === 0) {
                // There are no photo files.
                complete(null);
            } else {
                // Get rid of non-jpg files
                const jpgFiles = [];
                for (let i = 0, length = files.length; i < length; i++) {
                    const file = files[i];
                    // Only jpg files should be returned.
                    if (file.endsWith('.jpg')) {
                        jpgFiles.push(file);
                    }
                }
                // Sort if needed
                if (!sortOrder|| !jpgFiles || jpgFiles.length < 2) {
                    // No sort order requested, or we don't have at least 2 files,
                    // so there's nothing to sort anyway.
                    complete(jpgFiles);
                } else if (sortOrder === 'desc') {
                    // Order our array by newest file first
                    jpgFiles.sort(function(a, b) {
                        return fs.statSync(path.join(pumpkinData.photosDirectory, b)).mtime.getTime() -
                            fs.statSync(path.join(pumpkinData.photosDirectory, a)).mtime.getTime();
                    });
                    complete(jpgFiles);
                } else if (sortOrder === 'asc') {
                    // Order our array by oldest file first
                    jpgFiles.sort(function(a, b) {
                        return fs.statSync(path.join(pumpkinData.photosDirectory, a)).mtime.getTime() -
                            fs.statSync(path.join(pumpkinData.photosDirectory, b)).mtime.getTime();
                    });
                    complete(jpgFiles);
                } else {
                    // Invalid sort order
                    complete(null);
                }
            }
        }
    });
}

// public
const photosRepositoryPublic = {

    // Get all the photos as an array of photo objects
    getAll: function(pumpkinData, sortOrder, done) {
        getAllPhotoFilenames(pumpkinData, sortOrder, (files) => {
            if (!files) {
                done(null, 'Unable to get photo data', 500);
            } else {
                // Convert file names to photo objects array
                const photoDataArray = [];
                for (let i = 0, length = files.length; i < length; i++) {
                    const file = files[i];
                    const photo = fileNameToPhoto(file, pumpkinData.photosDirectory);
                    if (photo) {
                        photoDataArray.push(photo);
                    }
                }
                done(photoDataArray);
            }
        });
    },

    get: function(id, pumpkinData, done) {
        tryFileToPhoto(id, pumpkinData.photosDirectory, false, done);
    },

    // Get the most recent photo
    getLatest(pumpkinData, done) {
        getAllPhotoFilenames(pumpkinData, 'desc', (files) => {
            if (!files) {
                done(null, 'Unable to get photo data', 500);
            } else if (!files || files.length === 0) {
                // There are no photo files.
                done(null, 'no photos have been captured', 404);
            } else {
                tryFileToPhoto(files[0], pumpkinData.photosDirectory, false, done);
            }
        });
    },

    // Capture a new photo
    capture: function(pumpkinData, io, silent, done) {
        const filename = newPhotoFileName();
        const fullPath = path.join(pumpkinData.photosDirectory, filename);
        console.log('Capturing new photo to ' + fullPath);

        if (!silent) {
            // If not silent, play the smile sound and turn on the LEDS
            // so the user knows a photo is being taken
            soundsRepository.play('smile.wav', pumpkinData, function(result, error, status) {
                console.log('Play sound smile.wav complete.');
                console.log('   result = ' + JSON.stringify(result) + ' error = ' + error);
            });

            ledsRepository.updateAllLeds('on', pumpkinData, io, (result, error) => {
                console.log('LED ON result = ' + JSON.stringify(result) + ' error = ' + error);
            });

            // Set a timer to turn off the LEDs shortly.
            setTimeout(() => {
                ledsRepository.updateAllLeds('off', pumpkinData, io, (result, error) => {
                    console.log('LED OFF result = ' + JSON.stringify(result) + ' error = ' + error);
                });
            }, 2000);
        }

        const args = getWebcamArgs(pumpkinData, fullPath);

        execFile(fswebcam, args, (error, stdout, stderr) => {
            if (error) {
                console.log('fswebcam error: ' + error);
                done(null, 'unable to capture photo', 500);
            } else {
                console.log('fswebcam stdout: ' + stdout);
                console.log('fswebcam stderr: ' + stderr);

                // fswebcam doesn't set an error exit code on failure, and it always
                // writes to stderr, even on a succesful run. So, we can't reply
                // on error or stderr as indicators of success. Instead, we'll just see
                // if fileNameToPhoto throws an error.
                tryFileToPhoto(filename, pumpkinData.photosDirectory, true, (result, error, status) => {
                    if (!error) {
                        console.log('socket.io: photo-update ' + JSON.stringify(result));
                        io.sockets.emit('photo-update', result);
                    }
                    done(result, error, status);
                });
            }
        });
    }
};

module.exports = photosRepositoryPublic;
