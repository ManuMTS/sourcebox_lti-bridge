const $ = require('jquery');
const Terminal = require('term.js');

/* eslint-env browser */

/**
 * Gibt die Möglichkeit Befehle auch der Sandbox auszuführen (nur für Debugzwecke) 
 */
class Exec {
  /**
   * 
   * @param {Sourcebox} box Sandbox, in der die Befehle ausgeführt werden sollen 
   */
  constructor(box) {
    $('#exec').click(() => {
      const command = $('#command').val().split(' ');
      const process = box.exec(command.shift(), command, {
        term: {
          columns: 85,
          rows: 24,
        },
      });
      const div = document.createElement('div');
      $('#terms').append(div);
      const term = new Terminal({
        cols: 85,
        rows: 24,
        useStyle: true,
      });
      term.open(div);
      process.stdout.setEncoding('utf8');
      process.stdout.pipe(term).pipe(process.stdin);
    });
  }
}

exports = Exec;
module.exports = exports;
