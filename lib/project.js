'use strict';

var util = require('util');
var events = require('events');
var pathModule = require('path');

var _ = require('lodash');
var Promise = require('bluebird');
var split = require('split2');
var duplexify = require('duplexify');

Promise.longStackTraces();

var language = require('./language');
var sbutil = require('./util');

function Project(box, name, config) {
  Project.super_.call(this);

  this.box = box;
  this.name = name;

  this.files = {};
  this.mainFile = null;

  if (_.isString(config)) {
    config = language[config];
  }

  _.extend(this, config);

  this.path = this.path || name;

  this.running = false;
}

util.inherits(Project, events.EventEmitter);

Project.prototype._fileNames = function () {
  return Object.keys(this.files);
};

Project.prototype.reloadFiles = function () {
  return Promise.map(this._fileNames(), function (name) {
    var path = pathModule.join(this.path, name);
    return this.box.readFile(path)
      .bind(this)
      .then(function (contents) {
        this.files[name] = contents;
      });
  }.bind(this));
};

Project.prototype._commandArray = function (command) {
  if (_.isString(command)) {
    command = command.replace(/\$FILES/, function () {
      return this._fileNames().join(' ');
    }.bind(this));

    if (this.mainFile) {
      command = command.replace(/\$MAINFILE/, this.mainFile.path);
    }

    return ['bash', '-c', command];
  } else if (_.isFunction(command)) {
    return command(this._fileNames(), this.mainFile);
  } else if (_.isArray(command)) {
    return command.slice();
  }
};

Project.prototype._compile = function () {
  if (!this.compile) {
    return;
  }

  var command = this._commandArray(this.compile);

  var compiler = this.box.exec(command.shift(), command, {
    cwd: this.path,
    term: false
  });

  this.emit('compile', compiler);

  if (_.isFunction(this.parser)) {
    var parser = this.parser();

    compiler.stderr.pipe(split()).pipe(parser);

    var annotations = {};

    parser.on('data', function (annotation) {
      var array = annotations[annotation.file] = annotations[annotation.file] || [];
      array.push(_.omit(annotation, 'file'));
    });

    parser.on('end', function () {
      this.emit('annotations', annotations);
    }.bind(this));
  }

  var transform = new sbutil.TerminalTransform();

  compiler.stdout.pipe(transform, {end: false});
  compiler.stderr.pipe(transform, {end: false});

  this.stream.setReadable(transform);

  return sbutil.processPromise(compiler, true)
    .catch (function () {
      throw new Error('Compile failed');
    });
};

Project.prototype._exec = function () {
  if (!this.exec) {
    throw new Error('No exec command');
  }

  var command = this._commandArray(this.exec);

  var process = this.box.exec(command.shift(), command, { 
    term: true,
    cwd: this.path
  });

  this.emit('exec', process);

  this.stream.setReadable(process.stdout);
  this.stream.setWritable(process.stdin);

  return sbutil.processPromise(process, false);
};

Project.prototype._ensureDirs = function () {
  var paths = this._fileNames().map(function (name) {
    var path = pathModule.join(this.path, name);
    return pathModule.dirname(path);
  }, this);
 
  return this.box.mkdir(_.unique(paths), {
    parents: true
  });
};

Project.prototype._writeFiles = function () {
  return Promise.map(this._fileNames(), function (name) {
    var path = pathModule.join(this.path, name);
    return this.box.writeFile(path, this.files[name]);
  }.bind(this));
};

Project.prototype.run = function () {
  if (this.running) {
    throw new Error('already running');
  }

  this.running = true;

  this.stream = duplexify();

  this._ensureDirs()
    .bind(this)
    .then(this._writeFiles)
    .then(this._compile)
    .then(this._exec)
    .catch(function (err) {
      this.emit('error', err);
    })
    .finally(function () {
      this.emit('stop');
      this.running = false;
    });

  return this.stream;
};

module.exports = exports = Project;
exports.language = language;