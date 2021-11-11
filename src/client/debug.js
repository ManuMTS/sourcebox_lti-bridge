/* eslint-env browser */

/**
 * @file Hauptprogramm auf Clientseite für Debugs
 * @author Tobias Knobloch
 * @version 1.0.0
 */

const Sourcebox = require('@sourcebox/web');
const Exec = require('./lib-debug/exec');

const sourcebox = new Sourcebox(`${location.protocol}//${document.domain}`, {
  auth: globalOptions.token,
});

new Exec(sourcebox);
