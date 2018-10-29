// mock-onff.js
// Provides a mock version of the OnOff Gpio class
'use strict';

class MockGpio {
    constructor(gpio, direction, edge, options) {
        console.log('Mock GPIO constructor for gpio ' + gpio + '.');
        this._gpio = gpio;
        this._timeout = [];
    }

    writeSync(value) {
        console.log('Mock GPIO ' + this._gpio + ' writeSync ' + value + '.');
    }

    unexport() {
        console.log('Mock GPIO: unexport ' + this._gpio + '.');
    }

    watch(callback) {
        console.log('Mock GPIO: watch ' + this._gpio);
        const timeout = setInterval(() => {
            callback(null, 1);
        }, 5000);

        this._timeout.push(timeout);
    }

    unwatchAll() {
        console.log('Mock GPIO: unwatchAll ' + this._gpio);
        for (let i = 0, length = this._timeout.length; i < length; i++) {
            const timeout = this._timeout[i];
            clearInterval(timeout);
        }
    }
}

exports.MockGpio = MockGpio;
