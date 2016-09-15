// jshint browser:true

'use strict';

var Terminal = require('term.js');

var ace = require('brace');
require('brace/mode/c_cpp');
require('brace/theme/solarized_light');

var Project = require('@sourcebox/project');
var Sourcebox = require('@sourcebox/web');

var sourcebox = new Sourcebox('http://' + document.domain, {
  auth: localStorage.password
});

// editor

var editor = ace.edit('editor');
editor.setTheme('ace/theme/solarized_light');

global.editor = editor;

var session = editor.getSession();

session.setMode('ace/mode/c_cpp');

// project

var filename = 'program.c';

var project = new Project(sourcebox, 'project1', 'c');

session.on('change', function () {
  project.files[filename] = session.getValue();
});

project.files[filename] = session.getValue();

project.on('annotations', function (annotations) {
  if (annotations[filename]) {
    annotations = annotations[filename].map(function (annotation) {
      --annotation.row;
      --annotation.column;

      return annotation;
    });

    session.setAnnotations(annotations);
  } else {
    session.setAnnotations([]);
  }
});

project.on('compile', function () {
  term.write('\x1b[31m ---- COMPILING CODE ---- \x1b[m\r\n');
});

project.on('exec', function () {
  term.write('\x1b[31m ---- RUNNING BINARY ---- \x1b[m\r\n');
});

project.on('stop', function () {
  run.disabled = false;
});

project.on('error', function (error) {
  alert(error.message);
});

// buttons

var exec = document.getElementById('exec');
var run = document.getElementById('run');
var reload = document.getElementById('reload');
var terms = document.getElementById('terms');
var input = document.getElementById('command');

exec.addEventListener('click', function () {
  var command = input.value.split(' ');

  var process = sourcebox.exec(command.shift(), command, {
    term: {
      columns: 85,
      rows: 24
    }
  });

  var term = createTerm();

  process.stdout.setEncoding('utf8');
  process.stdout.pipe(term).pipe(process.stdin);
});

reload.addEventListener('click', function () {
  this.disabled = true;

  project.reloadFiles()
    .bind(this)
    .then(function () {
      session.setValue(project.files[filename]);
    })
    .catch(function (error) {
      alert(error.message);
    })
    .finally(function () {
      this.disabled = false;
    });
});

var term;

function runHandler() {
  this.disabled = true;

  if (term) {
    term.reset();
  } else {
    term = createTerm();
    global.term = term;
  }
  
  var stream = project.run();
  stream.setEncoding('utf8');
  stream.pipe(term, {end: false}).pipe(stream);
}

run.addEventListener('click', runHandler);



// helper

function createTerm() {
  var div = document.createElement('div');
  terms.appendChild(div);

  var term = new Terminal({
    cols: 85,
    rows: 24,
    useStyle: true
  });
  term.open(div);

  return term;
}
