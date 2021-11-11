/* eslint-env browser */

const $ = require('jquery');
const EventEmitter = require('events');
const _ = require('lodash');

window.$ = $;
window.jQuery = $;
require('bootstrap');
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

    this.saveButton = $('#save')[0];
    this.compileButton = $('#compile')[0];
    this.runButton = $('#run')[0];
    this.stopButton = $('#stop')[0];

    $('.btn-standart').click(function handleClick() {
      self.emit(this.id);
    });

    window.$('#remove').confirmation({
      rootSelector: '#remove',
      onConfirm() {
        self.emit('remove');
      },
    });

    this.resetButtons();
  }

  /**
   * Zurücksetzen aller Buttons zum Ausgangszustand
   * @return {undefined} 
   */
  resetButtons() {
    this.saveButton.disabled = true;
    this.compileButton.disabled = true;
    this.runButton.disabled = true;
    this.stopButton.disabled = true;
    $(this.stopButton).hide();
    $(this.runButton).show();
  }

  /**
   * Setzt Status der Buttons abhängig vom Zustandsautomat
   * @param {String} state Zeichenkette des aktuellen Zustandes
   * @return {undefined}
   */
  setState(state) {
    if (!_.isString(state)) {
      throw new Error('Buttons setState: invalid parameter exception');
    }
    this.resetButtons();
    switch (state) {
      case 'unsaved':
        this.saveButton.disabled = false;
        break;
      case 'saved':
        this.compileButton.disabled = false;
        break;
      case 'runnable':
        this.runButton.disabled = false;
        break;
      case 'compileError':
        break;
      case 'running':
        this.stopButton.disabled = false;
        $(this.runButton).hide();
        $(this.stopButton).show();
        break;
      default:
    }
  }
}

exports = Buttons;
module.exports = exports;
