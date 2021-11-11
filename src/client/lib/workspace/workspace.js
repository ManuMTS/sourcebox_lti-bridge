const EventEmitter = require('events');
const _ = require('lodash');
const $ = require('jquery');
const getSlug = require('speakingurl');

const Editor = require('./editor');
const Filetree = require('./filetree');
const TerminalSession = require('./terminalSession');
const Buttons = require('./buttons');
const Shortcuts = require('./shortcuts');

/**
 * Klasse, welche den kompletten Workspace händelt, dieser kann mehrere Datein enthalten 
 */
class Workspace extends EventEmitter {
  /**
   * Erstellt eines Workspace
   * @param {Object} files Objekt mit Dateinamen als Keys und Inhalt als Values.
   */
  constructor(files) {
    super();
    this.files = files;

    // Editor
    this.editor = new Editor()
      .on('fileChange', (filename, content) => {
        this.files[filename] = content;
        this.emit('edit');
      });

    _.each($('.tab-pane'), (tabcontent) => {
      const filenameClear = getSlug(tabcontent.id);
      const filename = $(tabcontent).attr('data-id');
      this.files[filename] = this.editor.addWindow(filename, filenameClear);
    });
    $('#fileTabs a:first').tab('show');

    // Filetree
    this.filetree = new Filetree(this.files)
      .on('fileAdded', (data) => {
        const filename = data.text;
        const filenameClear = getSlug(filename);
        this.files[filename] = this.editor.addWindow(filename, filenameClear);
        this.emit('edit');
      })
      .on('fileRenamed', (data) => {
        const newFilename = data.text;
        const oldFilename = data.old;

        this.files[newFilename] = this.files[oldFilename];
        delete this.files[oldFilename];

        this.editor.renameWindow(oldFilename, newFilename);

        const oldFilenameClear = getSlug(oldFilename);
        const newFilenameClear = getSlug(newFilename);

        $(`a[href="#${oldFilenameClear}"]`).attr('href', `#${newFilenameClear}`);
        $(`#${oldFilenameClear} .title`).html(newFilename);
        $(`#${oldFilenameClear}`).attr('id', newFilenameClear);
        $(`#${oldFilenameClear} _editor`).attr('id', `${newFilenameClear}_editor`);
        this.emit('renameFile', data.old);
      })
      .on('fileRemoved', (data) => {
        delete this.files[data.node.text];
        this.emit('removeFile', data.node.text);
      });

    // Terminal
    this.terminal = new TerminalSession();

    // Buttons
    this.buttons = new Buttons();
    ['newFile', 'rename', 'remove'].forEach((event) => {
      this.buttons.on(event, () => {
        this.filetree[event]();
      });
    });

    // Shortcuts
    this.shortcuts = new Shortcuts();

    // re-emit events
    ['save', 'compile', 'run', 'stop', 'download'].forEach((event) => {
      this.buttons.on(event, () => {
        this.emit(event);
      });
      this.shortcuts.on(event, () => {
        this.emit(event);
      });
      this.editor.on(event, () => {
        this.emit(event);
      });
      this.terminal.on(event, () => {
        this.emit(event);
      });
    });
  }

  /**
   * Setzt Status des Workspaces abhängig vom Zustandsautomat
   * @param {String} state Zeichenkette des aktuellen Zustandes
   * @return {undefined}
   */
  setState(state) {
    this.buttons.setState(state);
    this.filetree.setState(state);
    this.editor.setState(state);
  }

  /**
   * Teilt dem Workspace das Starten einer Aktion mit
   * @param {String} action Aktion die ausgeführt wird
   * @return {undefined}
   */
  startAction(action) {
    this.terminal.startAction(action);
  }

  /**
   * Teilt dem Workspace die Annotationen vom Kompiler mit
   * @param {Object} annotations Objekt mit allen Annotationen
   * @return {undefined}
   */
  annotations(annotations) {
    this.editor.setAnnotations(annotations);
    this.filetree.setAnnotations(annotations);
  }
}

exports = Workspace;
module.exports = exports;
