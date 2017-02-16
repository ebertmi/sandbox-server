'use strict';

var stream = require('stream');
var util = require('util');

var Promise = require('bluebird');

function processPromise(process, cleanExit) {
  return new Promise(function (resolve, reject) {
    process.on('error', function (err) {
      reject(err);
    });

    process.on('exit', function (code, signal) {
      if (code === 0 || !cleanExit) {
        resolve();
      } else {
        var error = new Error('Command failed: ' + process.spawnfile);
        error.code = code;
        error.signal = signal;

        reject(error);
      }
    });
  });
}

exports.processPromise = processPromise;

// terminal needs CR LF line terminators
function TerminalTransform() {
  TerminalTransform.super_.call(this);
}

util.inherits(TerminalTransform, stream.Transform);

TerminalTransform.prototype._transform = function (chunk, encoding, callback) {
  this.push(chunk.toString().replace(/\n/g, '\r\n'));
  callback();
};

exports.TerminalTransform = TerminalTransform;