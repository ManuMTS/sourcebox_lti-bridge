/* eslint-env browser */

const $ = require('jquery');
const EventEmitter = require('events');
const Terminal = require('term.js');
const _ = require('lodash');

/**
 * Händelt eine Terminal Session im Workspace
 */
class TerminalSession extends EventEmitter {
  /**
   * Erstellt eine Terminal Session
   */
  constructor() {
    super();
    const div = document.createElement('div');
    $('#terms').append(div);
    this.session = new Terminal({
      cols: 85,
      rows: 24,
      useStyle: true,
    });
    this.session.open(div);
    this.session.on('data', (data) => {
      switch (data.charCodeAt(0)) {
        // @TODO: check if this commands work with mac and windows
        case 19: // ctrl + s
          this.emit('save');
          break;
        case 2: // ctrl + b
          this.emit('compile');
          break;
        case 21: // ctrl + u
          this.emit('stop');
          this.emit('run');
          break;
        default:
      }
    });
  }

  /**
   * Druckt Ausgeführte Aktion in Konsole, Ausnahme 'edit'
   * @param {String} action Aktion die ausgeführt wird
   * @return {undefined}
   */
  startAction(action) {
    if (!_.isString(action)) {
      throw new Error('Buttons setState: invalid parameter exception');
    }
    if (action !== 'edit') {
      this.session.write(`\x1b[31m ---- ${action} program ---- \x1b[m\r\n`);
    }
  }
}

exports = TerminalSession;
module.exports = exports;
