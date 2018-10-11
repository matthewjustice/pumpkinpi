// app.js
// node.js + express application 

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);

const Gpio = require('onoff').Gpio;
const MockGpio = require('./mocks/mock-onoff').MockGpio;
const MOTION_SENSOR_PIN = 4;
const LED_OUTPUT_PIN_1 = 17;
const LED_OUTPUT_PIN_2 = 27;


var app = express();
app.io = io;

// Custom property for app data
app.pumpkinData = {};
if(Gpio.accessible) {
    app.pumpkinData.led1 = new Gpio(LED_OUTPUT_PIN_1, 'out');
    app.pumpkinData.led2 = new Gpio(LED_OUTPUT_PIN_2, 'out');
    app.pumpkinData.motionSensorDevice = new Gpio(MOTION_SENSOR_PIN, 'in', 'rising');
} else {
    console.log('GPIO not accessible. Using mock.');
    app.pumpkinData.led1 = new MockGpio(LED_OUTPUT_PIN_1, 'out');
    app.pumpkinData.led2 = new MockGpio(LED_OUTPUT_PIN_2, 'out');
    app.pumpkinData.motionSensorDevice = new MockGpio(MOTION_SENSOR_PIN, 'in', 'rising');
}

// Store the location of files
app.pumpkinData.soundsDirectory = __dirname + '/sounds';
app.pumpkinData.photosDirectory = __dirname + '/public/photos';

// Track which features are enabled.
// Keep in sync with features.json (maybe should do this programmatically)
app.pumpkinData['motion-sensor-enabled'] = false;

// Handle motion sensor events
const motionSensor = require('./models/motion-sensor')(app.pumpkinData, io)
app.pumpkinData.motionSensorDevice.watch(motionSensor.callback);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'vash');

// setup middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
var defaultRouter = require('./routes/default-router');
var ledsRouter = require('./routes/leds-router')(io);
var soundsRouter = require('./routes/sounds-router');
var featuresRouter = require('./routes/features-router')(io);
var photosRouter = require('./routes/photos-router');
app.use('/', defaultRouter);
app.use('/api/leds', ledsRouter);
app.use('/api/sounds', soundsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/photos', photosRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
