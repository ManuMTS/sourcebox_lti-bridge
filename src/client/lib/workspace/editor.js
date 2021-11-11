const ace = require('brace');
const _ = require('lodash');
const EventEmitter = require('events');
const $ = require('jquery');

require('brace/mode/c_cpp');
require('brace/theme/solarized_light');
require('brace/ext/searchbox');
require('brace/ext/language_tools');

/**
 * Klasse, welche alle Fenster des Editors in einem Workspace händelt
 */
class Editor extends EventEmitter {
  /**
   * Erstellt einen Editor
   */
  constructor() {
    super();
    this.windows = {};

    // need to do this, to show changes in the editor during hide
    $('a[data-toggle="tab"]').on('shown.bs.tab', (event) => {
      const filename = $(event.target).attr('data-id');
      this.windows[filename].resize();
    });
  }

  /**
   * Fügt dem Editor ein Fenster hinzu
   * @param {String} filename Dateiname 
   * @param {String} filenameClear Dateiname ohne Sonderzeichen
   * @return {undefined}
   */
  addWindow(filename, filenameClear) {
    if (!_.isString(filename) || !_.isString(filenameClear)) {
      throw new Error('Editor addWindow: invalid parameter exception');
    }
    const self = this;
    const window = ace.edit(`${filenameClear}_editor`);
    window.setTheme('ace/theme/solarized_light');
    window.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: false,
    });
    window.commands.addCommand({
      name: 'save',
      bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
      exec() {
        self.emit('save');
      },
    });
    window.commands.addCommand({
      name: 'compile',
      bindKey: { win: 'Ctrl-b', mac: 'Command-b' },
      exec() {
        self.emit('compile');
      },
    });
    window.commands.addCommand({
      name: 'stop_run',
      bindKey: { win: 'Ctrl-u', mac: 'Command-u' },
      exec() {
        self.emit('stop');
        self.emit('run');
      },
    });
    const session = window.getSession();
    const searchButton = $(`.search[data-id="${filename}"]`);
    searchButton.click(() => {
      window.execCommand('find');
    });
    const replaceButton = $(`.replace[data-id="${filename}"]`);
    replaceButton.click(() => {
      window.execCommand('replace');
    });
    const undoButton = $(`.undo[data-id="${filename}"]`);
    const redoButton = $(`.redo[data-id="${filename}"]`);
    const checkUndo = function checkUndo() {
      const um = session.getUndoManager();
      undoButton.attr('disabled', !um.hasUndo());
      redoButton.attr('disabled', !um.hasRedo());
    };
    undoButton.click(() => {
      window.undo();
      checkUndo();
    });
    redoButton.click(() => {
      window.redo();
      checkUndo();
    });
    session.setMode('ace/mode/c_cpp');
    session.id = filename;
    session.on('change', (changes, changeSession) => {
      this.emit('fileChange', changeSession.id, changeSession.getValue());
      checkUndo();
    });
    this.windows[filename] = window;
    return session.getValue();
  }

  /**
   * Nennt ein Fenster um
   * @param {String} oldFilename Alter Dateiname
   * @param {String} newFilename Neuer Dateiname
   * @return {undefined}
   */
  renameWindow(oldFilename, newFilename) {
    if (!_.isString(oldFilename) || !_.isString(newFilename)) {
      throw new Error('Editor renameWindow: invalid parameter exception');
    }
    this.windows[newFilename] = this.windows[oldFilename];
    const session = this.windows[newFilename].getSession();
    session.id = newFilename;
    delete this.windows[oldFilename];
  }

  /**
   * Sperrt die Eingabe in ein Fenster oder hebt diese auf
   * @param {Boolean} readOnly true: Fensterinhalt gesperrt, false: Fensterinhalt editierbar
   * @return {undefined}
   */
  setReadOnly(readOnly) {
    if (!_.isBoolean(readOnly)) {
      throw new Error('Editor setReadOnly: invalid parameter exception');
    }
    _.each(this.windows, (window) => {
      window.setReadOnly(readOnly);
    });
  }

  /**
   * Setzt die Annotationen vom Kompiler im Editor
   * @param {Object} annotations Objekt mit allen Annotationen
   * @return {undefined}
   */
  setAnnotations(annotations) {
    if (!_.isObject(annotations)) {
      throw new Error('Editor setAnnotations: invalid parameter exception');
    }
    _.each(Object.keys(this.windows), (filename) => {
      if (!this.windows[filename]) {
        return;
      }
      const session = this.windows[filename].getSession();
      if (annotations[filename]) {
        const correctedAnnotations = annotations[filename].map((annotation) => {
          const correctedAnnotation = annotation;
          correctedAnnotation.row -= 1;
          correctedAnnotation.column -= 1;
          return correctedAnnotation;
        });
        session.setAnnotations(correctedAnnotations);
      } else {
        session.setAnnotations([]);
      }
    });
  }

  /**
   * Setzt Status des Editors abhängig vom Zustandsautomat
   * @param {String} state Zeichenkette des aktuellen Zustandes
   * @return {undefined}
   */
  setState(state) {
    if (!_.isString(state)) {
      throw new Error('Editor setState: invalid parameter exception');
    }
    switch (state) {
      case 'saving':
      case 'compiling':
      case 'running':
        this.setReadOnly(true);
        break;
      default:
        this.setReadOnly(false);
    }
  }
}

exports = Editor;
module.exports = exports;
