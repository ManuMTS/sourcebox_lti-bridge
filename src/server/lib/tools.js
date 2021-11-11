/**
 * @file Sammlung an nützlichen Funktionen auf Serverseite {@link module:ServerTools}
 * @author Tobias Knobloch
 * @version 1.0.0
 */

/**
 * Sammlung an nützlichen Funktionen auf Serverseite
 * @module ServerTools
 */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

/**
 * Einstellungen für die express.JS Anwendunng
 * Gesetzt werden u.a. Render Enginge, statische Ordner & Origin Headers
 * @param {Object} app Instanz der Anwendung
 * @return {undefined}
 */
exports.httpServerConfig = (app) => {
  app.set('view engine', 'pug');
  app.use(express.static('public'));
  app.use('/node_modules/bootstrap/dist/fonts',
    express.static(path.join(__dirname, '/../../../node_modules/bootstrap/dist/fonts')));
  app.use('/node_modules/jstree/dist/themes/default',
    express.static(path.join(__dirname, '/../../../node_modules/jstree/dist/themes/default')));
  app.use('/node_modules/font-awesome/fonts/',
    express.static(path.join(__dirname, '/../../../node_modules/font-awesome/fonts/')));
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true,
  }));

  app.get('/', (req, res) => {
    res.sendStatus(403);
  });
};

/**
 * Konvertiert Sonderzeichen in einem String zu HTML
 * @example convertCode('&') // returns '&amp';
 * @param {String} str Zeichenkette, welche konvertiert werden soll
 * @returns {String} Konvertierte Zeichenkette
 */
exports.convertCode = (str) => {
  let ret = str;
  ret = ret.replace(/&/g, '&amp;');
  ret = ret.replace(/>/g, '&gt;');
  ret = ret.replace(/</g, '&lt;');
  ret = ret.replace(/'/g, '&quot;');
  ret = ret.replace(/'/g, '&#039;');
  ret = ret.replace(/[^\S\r\n]/g, ' ');
  return ret;
};
