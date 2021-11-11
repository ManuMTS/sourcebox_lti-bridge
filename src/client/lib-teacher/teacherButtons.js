/* eslint-env browser */

const EventEmitter = require('events');

require('bootstrap-confirmation2/bootstrap-confirmation');

/**
 * Klasse, welche alle Buttons des Workspace händelt
 */
class Buttons extends EventEmitter {
  /**
  * Buttons anlegen
  */
  constructor() {
    super();
    const self = this;

    window.$('#endCourse').confirmation({
      rootSelector: '#endCourse',
      onConfirm() {
        self.emit('endCourse');
      },
    });
  }
}

exports = Buttons;
module.exports = exports;
