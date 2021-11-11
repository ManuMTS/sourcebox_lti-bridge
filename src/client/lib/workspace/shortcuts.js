const Mousetrap = require('mousetrap');
const EventEmitter = require('events');

/**
 * Klasse, welche die Shortcuts im Project handhabt
 */
class Shortcuts extends EventEmitter {
  /**
   * Erstellt eine Instanz der Shortcuts
   */
  constructor() {
    super();
    Mousetrap.bind(['ctrl+s', 'command+s'], () => {
      this.emit('save');
      return false;
    });
    Mousetrap.bind(['ctrl+b', 'command+b'], () => {
      this.emit('compile');
      return false;
    });
    Mousetrap.bind(['ctrl+u', 'command+u'], () => {
      this.emit('stop');
      this.emit('run');
      return false;
    });
  }
}

exports = Shortcuts;
module.exports = exports;
