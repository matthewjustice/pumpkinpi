// photos-repository.js
// Defines the photos repository object model for accessing the photos data 
// stored on the file system.
// 
// All repository functions take a callback function:
//     done (result, error, status)
//           result = the data to return, if any
//           error  = any error string, if any
//           status = the numeric http status code, if any

// private
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const pathUrlPrefix = '/photos/';

// Normally, fswebcam should be set to 'fswebcam'.
const fswebcam = 'fswebcam';
const fswebcamArgs = ['-S', '2', '--set', 'brightness=50%'];
// For testing purposes, use these values:
//const fswebcam = 'touch';
//const fswebcamArgs = [];

// Converts a filename to a photo object if it isn't a directory.
// This function can throw if the file can't be accessed.
function fileNameToPhoto(filename, photosDirectory) {
    // Make sure this is a file and not a directory.
    let fullPath = path.join(photosDirectory, filename);
    let stats = fs.statSync(fullPath);
    if(!stats.isDirectory()) {
        let photo = {};
        photo.id = filename;
        photo.path = path.join(pathUrlPrefix, filename);
        return photo;
    }
    else {
        return null;
    }
}

// Wrapper for fileNameToPhoto with done callback
function tryFileToPhoto(filename, photosDirectory, capture, done) {
    try
    {
        let photo = fileNameToPhoto(filename, photosDirectory);
        if(photo) {
            done(photo);
        }
        else {
            done(null, 'invalid photo', 404)
        }
    }
    catch(err) {
        // The err object thrown by fs.statSync contains the 
        // full path to the file. We don't want to return that, 
        // so swallow the error details.
        if(capture) {
            done(null, 'unable to capture photo', 500);
        }
        else if(err.code = 'ENOENT') {
            done(null, 'photo ' + filename + ' does not exist', 404);
        }
        else {
            done(null, 'unable to access photo ' + filename, 500);
        }
    }
}

// Generates a new filename
function newPhotoFileName() {
    let date = new Date(Date.now());
    let filename = date.toISOString(); // returns YYYY-MM-DDTHH:mm:ss.sssZ
    filename = filename.replace(/:/gi, '-');
    return filename + '.jpg';
}

// public
var photosRepositoryPublic = {
    
    // Get all the photos as an array of photo objects
    getAll: function (pumpkinData, done) {
        fs.readdir(pumpkinData.photosDirectory, (err, files) => {
            if(err) {
                done(null, err, 500);
            }
            else {
                // Convert file names to photo objects array
                let photoDataArray = [];
                for(var i = 0, length = files.length; i < length; i++)
                {
                    var file = files[i];
                    // Only jpg files should be returned.
                    if(file.endsWith('.jpg')) {
                        let photo = fileNameToPhoto(file, pumpkinData.photosDirectory);
                        if(photo) {
                            photoDataArray.push(photo);
                        }
                    }
                }
                done(photoDataArray);
            }
          });
    },

    get: function (id, pumpkinData, done) {
        tryFileToPhoto(id, pumpkinData.photosDirectory, false, done);
    },

    // Get the most recent photo
    getLatest(pumpkinData, done) {
        fs.readdir(pumpkinData.photosDirectory, (err, files) => {
            if(err) {
                done(null, err, 500);
            }
            else {
                if(!files || files.length === 0) {
                    // There are no photo files.
                    done(null, 'no photos have been captured', 404);
                }
                else {
                    // Get rid of non-jpg files
                    let jpgFiles = [];
                    for(var i = 0, length = files.length; i < length; i++)
                    {
                        var file = files[i];
                        // Only jpg files should be returned.
                        if(file.endsWith('.jpg')) {
                            jpgFiles.push(file);
                        }
                    }

                    // Do we still have at least one file?
                    if(!jpgFiles || jpgFiles.length === 0) {
                        // There are no photo files.
                        done(null, 'no photos have been captured', 404);
                    }
                    else {
                        // Order our files array by newest file
                        jpgFiles.sort(function(a, b) {
                            return fs.statSync(path.join(pumpkinData.photosDirectory, b)).mtime.getTime() - 
                            fs.statSync(path.join(pumpkinData.photosDirectory, a)).mtime.getTime();
                        });

                        tryFileToPhoto(jpgFiles[0], pumpkinData.photosDirectory, false, done);
                    }
                }
            }
          });
    },

    // Capture a new photo
    capture: function (pumpkinData, done)
    {
        let filename = newPhotoFileName();
        let fullPath = path.join(pumpkinData.photosDirectory, filename);
        console.log('Capturing new photo to ' + fullPath);

        // Add our filename to the end of the args already defined
        let args = fswebcamArgs.slice(0);
        args.push(fullPath);

        execFile(fswebcam, args, (error, stdout, stderr) => {
            if(error) {
                console.log('fswebcam error: ' + error);
                done(null, 'unable to capture photo', 500);
            }
            else {
                console.log('fswebcam stdout: ' + stdout);
                console.log('fswebcam stderr: ' + stderr);

                // fswebcam doesn't set an error exit code on failure, and it always
                // writes to stderr, even on a succesful run. So, we can't reply 
                // on error or stderr as indicators of success. Instead, we'll just see
                // if fileNameToPhoto throws an error.
                tryFileToPhoto(filename, pumpkinData.photosDirectory, true, done);
            }
        });
    }
}

module.exports = photosRepositoryPublic;