/**
 * @file Beeinhaltet die Klasse {@link RegexParser}, welche die Kompilerrückgabe untersucht
 * @author Michael Ebert, Tobias Knobloch
 * @version 1.0.0
 */

const stream = require('stream');
const util = require('util');

const _ = require('lodash');

// parser spucken objekte aus:
//  {
//    file: string
//    type: 'info' | 'warning' | 'error',
//    text: string,
//    row: int,
//    column: int
//  }

/**
 * Standart Callback, wenn nicht anders angegeben
 * @param {Object} matches Matches
 * @param {Object} labels Labels, bestehend aus type und text
 * @return {undefined}
 */
function defaultCallback(matches, labels) {
  if (!labels.file || labels.row === null) {
    // file and row are required
    return;
  }

  let type = labels.type.trim();

  const text = labels.text || _.capitalize(type);

  if (/error/i.test(type)) {
    type = 'error';
  } else if (/warning/i.test(type)) {
    type = 'warning';
  } else if (/^e/i.test(type)) {
    type = 'error';
  } else if (/^w/i.test(type)) {
    type = 'warning';
  } else {
    // tag as info if it doesn't match any other type
    type = 'info';
  }

  const labelsCorrected = labels;
  labelsCorrected.type = type;
  labelsCorrected.text = text;

  this.push(labelsCorrected);
}

/**
 * @param {Object} labels Labels, bestehend aus type und text
 * @param {Function} fn Aufzurufende Funktion
 * @return {Function} Funktion mit dem Parameter matches
 */
function mapLabels(labels, fn) {
  return function _mapLabels(matches) {
    const map = labels.reduce((map_, label, i) => {
      const map__ = map_;
      map__[label] = matches[i + 1];
      return map__;
    }, {});

    return fn.call(this, matches, map);
  };
}

// vllt parser definieren als object mit .stream() methode die einen through
// stream generiert?

/**
 * Initiert den Regex Parser
 * @constructor
 * @param {Object} matchers_ - Ein Object bestehend aus **regex** Ausdruck und **labels**
 * @param {int} lines[1] - Optional Länge des Eingans Buffer
 * @return {Object} aus **regex** Ausdruck und callback
 */
function RegexParser(matchers_, lines) {
  RegexParser.super_.call(this, { readableObjectMode: true });

  let matchers = matchers_;
  if (_.isPlainObject(matchers)) {
    matchers = [matchers];
  }

  this.lines = lines || 1;
  this.buffer = [];

  this.matchers = matchers.map((matcher) => {
    if (!matcher.regex) {
      throw new Error('Regex is required');
    }

    return {
      regex: matcher.regex,
      callback: mapLabels(matcher.labels, matcher.callback || defaultCallback),
    };
  });
}

util.inherits(RegexParser, stream.Transform);

/**
 * Prüft die Übereinstimmung des regex ausdruck und des text aus dem buffer
 * @return {Boolean} Übereinstimmung
 */
RegexParser.prototype.match = function match() {
  const text = this.buffer.join('\n');

  this.matchers.some((matcher) => {
    const regex = matcher.regex;
    const matches = regex.exec(text);

    if (matches) {
      return matcher.callback.call(this, matches) !== false;
    }
    return undefined;
  }, this);
};

/**
 * Prüft die Übereinstimmung des regex ausdruck und des text aus dem buffer
 * @param {String} chunk Teil des Strings (wird in buffer gepusht)
 * @param {String} encoding Encoding des Chunk Parameters
 * @param {Callback} callback Wird am Ende aufgerufen
 * @return {undefined}
 */
RegexParser.prototype._transform = function _transform(chunk, encoding, callback) {
  this.buffer.push(chunk.toString());

  if (this.buffer.length === this.lines) {
    this.match();
    this.buffer.shift();
  }

  callback();
};

/**
 * @param {Callback} callback Wird am Ende aufgerufen
 * @return {undefined}
 */
RegexParser.prototype._flush = function _flush(callback) {
  if (this.buffer.length && this.buffer.length < this.lines) {
    // stream ended and we dont have enough lines, try to match anyway
    this.match();
  }

  callback();
};

exports = RegexParser;
module.exports = exports;
