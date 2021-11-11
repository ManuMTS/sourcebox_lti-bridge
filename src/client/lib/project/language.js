/**
 * @file Datei mit Einstellungen für verschiedene Programmiersprachen {@link module:Language}
 * @author Michael Ebert, Tobias Knobloch
 * @version 1.0.0
 */

/**
 * Modul mit Einstellungen für verschiedene Programmiersprachen
 * @module Language
 */

const RegexParser = require('./parser');

// a few default languages
// these could be parser config objects?

// exec, compile etc. can be array, string or function
// function is called with list of filenames relative to project
// string has $FILES replaced with a list of files and run through a shell
// $MAINFILE is also replaced
// array is left as it is?
//
// if parser is specified compiler output will be parsed!!

/**
 * Object mit Einstellungen zu Compiler, Ausführung und Fehlererkennung 
 * zu verschiedenen Programmiersprachen
 */
const languages = {
  c: {
    compile: 'gcc -Wall $FILES',
    exec: ['./a.out'],
    stop: 'pkill -e a.out',
    parser() {
      return new RegexParser({
        regex: /^(.+):(\d+):(\d+): (?:fatal )?(error|warning|note): (.*)$/,
        labels: ['file', 'row', 'column', 'type', 'text'],
      });
    },
  },

  java: {
    compile: 'javac -Xlint $FILES',
    exec(files, mainFile) {
      const className = mainFile.replace(/\.java$/, '').replace(/\//g, '.');
      return ['java', className];
    },
    parser() {
      return new RegexParser({
        regex: /^(.+):(\d+): (error|warning): (.+)\n.*\n( +)\^$/,
        labels: ['file', 'row', 'type', 'text', 'column'],
        callback(matches, labels) {
          const correctetLabels = labels;
          correctetLabels.column = correctetLabels.column.length + 1;
          this.push(correctetLabels);
        },
      }, 3);
    },
  },
};

// aliases
languages.cpp = languages.c;
languages['c++'] = languages.cpp;

exports = languages;
module.exports = exports;
