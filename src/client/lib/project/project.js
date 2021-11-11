/**
 * @file Beeinhaltet die Klasse {@link Project}
 * @author Michael Ebert, Tobias Knobloch
 * @version 1.0.0
 */

const EventEmitter = require('events');
const pathModule = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const split = require('split2');
const duplexify = require('duplexify');
const JSZip = require('jszip');
const FileSaver = require('file-saver');

const language = require('./language');
const processPromise = require('./processPromise');
const TerminalTransform = require('./terminalTransform');

Promise.longStackTraces();


/**
 * Klasse, welche ein Projekt enthält. Sie weißt das Speichern, 
 * Kompilieren, Ausführen oder Herunterladen eines Projektes an
 */
class Project extends EventEmitter {
  /**
   * Initiert eine Projekt
   * @param {Sourcebox} box - Sandbox, in der kompiliert und ausgeführt werden soll
   * @param {String} name - Name des Projektes
   * @param {String} config - Konfiguration (Programmiersprache)
   * @param {Object} files Objekt mit Dateinamen als Keys und Inhalt als Values.
   */
  constructor(box, name, config, files) {
    super();

    this.box = box;
    this.name = name;

    this.files = files;
    this.mainFile = null;

    this.config = config;
    if (_.isString(this.config)) {
      this.config = language[this.config];
    }

    this.path = this.path || name;
  }

  /**
   * Gibt alle Dateinamen aus dem Projekt zurück
   * @return {Array} Array aus Dateinamen
   * @private
   */
  _fileNames() {
    return Object.keys(this.files);
  }

  /**
   * Liest alle Dateien aus Sandbox aus und speichert diese in this.files
   * @return {Method} Bluebird Promise
   */
  reloadFiles() {
    return Promise.map(this._fileNames(), (name) => {
      const path = pathModule.join(this.path, name);
      return this.box.readFile(path)
        .bind(this)
        .then((contents) => {
          this.files[name] = contents;
        });
    });
  }

  /**
   * Konvertiert Befehl(e) in ein in der Sandbox ausführbares Format 
   * @param {String|Function|Array} command_ Befehl(e)
   * @return {Array} Array aus ausführbaren Befehlen
   * @private
   */
  _commandArray(command_) {
    let command = command_;
    if (_.isString(command)) {
      command = command.replace(/\$FILES/, _.filter(this._fileNames(), filename => filename.endsWith('.c')).join(' '));

      if (this.mainFile) {
        command = command.replace(/\$MAINFILE/, this.mainFile.path);
      }

      return ['bash', '-c', command];
    } else if (_.isFunction(command)) {
      return command(this._fileNames(), this.mainFile);
    } else if (_.isArray(command)) {
      return command.slice();
    }
    return undefined;
  }

  /**
   * Kompiliert das Programm
   * @private  
   * @return {Method} Bluebird Promise
   */
  _compile() {
    if (!this.config.compile) {
      return undefined;
    }

    const command = this._commandArray(this.config.compile);

    const compiler = this.box.exec(command.shift(), command, {
      cwd: this.path,
      term: false,
    });

    const self = this;
    if (_.isFunction(this.config.parser)) {
      const parser = this.config.parser();

      compiler.stderr.pipe(split()).pipe(parser);

      const annotations = {};

      parser.on('data', (annotation) => {
        annotations[annotation.file] = annotations[annotation.file] || [];
        const array = annotations[annotation.file];
        array.push(_.omit(annotation, 'file'));
        if (annotation.type === 'error') {
          self._logError(annotation.text);
        }
      });

      parser.on('end', () => {
        this.emit('annotations', annotations);
      });
    }

    const transform = new TerminalTransform();

    compiler.stdout.pipe(transform, { end: false });
    compiler.stderr.pipe(transform, { end: false });

    this.stream.setReadable(transform);

    return processPromise(compiler, true)
      .catch(() => {
        throw new Error('Compile failed');
      }).then(() => {
        self.emit('compileSuccess');
      });
  }

  /**
   * Führt das Programm aus
   * @private  
   * @return {Method} Bluebird Promise
   */
  _exec() {
    if (!this.config.exec) {
      throw new Error('No exec command');
    }

    const command = this._commandArray(this.config.exec);

    const process = this.box.exec(command.shift(), command, {
      term: true,
      cwd: this.path,
    });

    this.stream.setReadable(process.stdout);
    this.stream.setWritable(process.stdin);

    return processPromise(process, false);
  }

  /**
   * Stoppt die Ausführung eines Programm
   * @private  
   * @return {Method} Bluebird Promise
   */
  _stop() {
    if (!this.config.stop) {
      throw new Error('No stop command');
    }

    const command = this._commandArray(this.config.stop);

    const process = this.box.exec(command.shift(), command, {
      term: true,
      cwd: this.path,
    });

    this.stream.setReadable(process.stdout);
    this.stream.setWritable(process.stdin);

    return processPromise(process, false);
  }

  /**
   * Stellt sicher, dass Ordner vorhanden sind und erstellt diese gegebenfalls
   * @private  
   * @return {Method} Bluebird Promise
   */
  _ensureDirs() {
    const paths = this._fileNames().map((name) => {
      const path = pathModule.join(this.path, name);
      return pathModule.dirname(path);
    }, this);
    return this.box.mkdir(_.uniq(paths), {
      parents: true,
    });
  }

  /**
   * Schreibt alle Dateien in die Sandbox
   * @private  
   * @return {Method} Bluebird Promise
   */
  _writeFiles() {
    return Promise.map(this._fileNames(), (name) => {
      const path = pathModule.join(this.path, name);
      return this.box.writeFile(path, this.files[name]);
    });
  }

  /**
   * Löscht eine Dateie aus der Sandbox
   * @private
   * @param {String} oldFilename Zu löschende Datei
   * @return {Method} Bluebird Promise
   */
  _removeFile(oldFilename) {
    const path = pathModule.join(this.path, oldFilename);
    return this.box.rm([path], {
      recursive: false,
      force: true,
      dir: false,
    });
  }

  /**
   * Loggen eines Fehlers
   * @private  
   * @param {String} errorMessage Fehlernachricht
   * @return {Method} Bluebird Promise
   */
  _logError(errorMessage) {
    this.box.socket.emit('logError', { errorMessage });
  }

  /**
   * Löscht eine Datei aus der Sandbox
   * @param {String} oldFilename Zu löschende Datei
   * @return {undefined}
   */
  removeFile(oldFilename) {
    this._removeFile(oldFilename);
  }

  /**
   * Umbenennen eines Programmes
   * @param {String} oldFilename Alter Dateiname
   * @return {undefined}
   */
  renameFile(oldFilename) {
    this._removeFile(oldFilename)
      .bind(this)
      .then(this._writeFiles);
  }

  /**
   * Speichern eines Programmes
   * @return {undefined}
   */
  save() {
    this._ensureDirs()
      .bind(this)
      .then(this._writeFiles)
      .finally(() => {
        this.emit('saved');
      });
  }

  /**
   * Kompilierung eines Programmes
   * @return {Stream} Rückgabe aus der Sandbox
   */
  compile() {
    this.stream = duplexify();
    this._removeFile('a.out')
      .bind(this)
      .then(this._compile)
      .catch((err) => {
        this.emit('compileFailure', err);
      });
    this.stream.setEncoding('utf8');
    return this.stream;
  }

  /**
   * Ausführung eines Programmes
   * @return {Stream} Rückgabe aus der Sandbox
   */
  run() {
    this.stream = duplexify();
    this._exec()
      .bind(this)
      .finally(() => {
        this.emit('stopped');
      });
    this.stream.setEncoding('utf8');
    return this.stream;
  }

  /**
   * Stopp die Ausführung eines Programmes
   * @return {Stream} Rückgabe aus der Sandbox
   */
  stop() {
    this.stream = duplexify();
    this._stop();
    this.stream.setEncoding('utf8');
    return this.stream;
  }

  /**
   * Herunterladen eines kompletten Projektes
   * @return {undefined}
   */
  download() {
    const zip = new JSZip();

    _.each(this.files, (content, filename) => {
      zip.file(filename, content);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      FileSaver.saveAs(content, `${this.name}.zip`);
    });
  }
}

exports = Project;
module.exports = exports;
