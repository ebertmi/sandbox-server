'use strict';

var RegexParser = require('./parser');

// a few default languages
// these could be parser config objects?

// exec, compile etc. can be array, string or function
// function is called with list of filenames relative to project
// string has $FILES replaced with a list of files and run through a shell
// $MAINFILE is also replaced
// array is left as it is?
//
// if parser is specified compiler output will be parsed!!

var languages = {
  c: {
    compile: 'gcc -Wall $FILES',
    exec: ['./a.out'],
    parser: function () {
      return new RegexParser({
        regex: /^(.+):(\d+):(\d+): (?:fatal )?(error|warning|note): (.*)$/,
        labels: ['file', 'row', 'column', 'type', 'text']
      });
    }
  },

  java: {
    compile: 'javac -Xlint $FILES',
    exec: function (files, mainFile) {
      var className = mainFile.replace(/\.java$/, '').replace(/\//g, '.');
      return ['java', className];
    },
    parser: function () {
      return new RegexParser({
        regex: /^(.+):(\d+): (error|warning): (.+)\n.*\n( +)\^$/,
        labels: ['file', 'row', 'type', 'text', 'column'],
        callback: function (matches, labels) {
          labels.column = labels.column.length + 1;
          this.push(labels);
        }
      }, 3);
    }
  }
};

// aliases
languages['c++'] = languages.cpp = languages.c;

module.exports = exports = languages;