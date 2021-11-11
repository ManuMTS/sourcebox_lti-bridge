/**
* @file Hauptprogramm auf Serverseite {@link module:Server}
* @author Michael Ebert, Tobias Knobloch
* @version 1.0.0
*/

/**
* Hauptprogramm auf Serverseite
* @module Server
*/

const express = require('express');

const app = express();
const Server = require('@sourcebox/web');
const Sourcebox = require('@sourcebox/sandbox');

const Session = Server.Session;
const http = require('http');
const lti = require('ims-lti');
const getSlug = require('speakingurl');
const crypto = require('crypto');

const httpServer = http.createServer(app);
const tools = require('./lib/tools');
const _ = require('lodash');
const Config = require('config');
const DbSession = require('./lib/database');
const debug = require('debug')('sourcebox:lti_bridge');

const dbSessions = {};

/**
 * Erweitert die ServerSession
 */
class CustomSession extends Session {
  /**
   * Wird beim Speichern einer Datei aufgerufen, speichert die Datei auch in die Datenbank
   * @param {String} file Dateipfad
   * @param {Buffer} buffer Dateiinhalt
   * @return {Unknown} Rückgabe der super.onWriteFile Funktion
   */
  onWriteFile(file, buffer) {
    if (!_.isString(file) || !Buffer.isBuffer(buffer)) {
      debug('%s called writeFile with invalid arguments', this.id);
      throw new TypeError('Invalid arguments');
    }
    if (buffer.length > Config.database.fileLimitKB * 1000) {
      debug('%s called writeFile: File to big!', this.id);
      throw new TypeError('File to big!');
    }
    dbSessions[this.id].numberOfFiles((err, result) => {
      if (err) {
        debug('dbSession numberOfFiles failed: %s', err);
      }
      if (result > Config.database.maxNumberOfFiles) {
        throw new TypeError('To many files!');
      }
      const filename = file.substr(file.lastIndexOf('/') + 1);
      dbSessions[this.id].saveFile(filename, buffer, (err2) => {
        if (err2) {
          debug('dbSession saveFile failed: %s', err2);
        }
      });
    });
    return super.onWriteFile(file, buffer);
  }
  /**
   * Bindet Funktionen an den socket
   * @param {Socket} socket Socket, an den gebunden werden soll
   * @return {Unknown} Rückgabe der super._bind Funktion
   */
  _bind(socket) {
    socket.on('logError', (data) => {
      dbSessions[this.id].saveError(data.errorMessage, (err) => {
        if (err) {
          debug('dbSession saveError failed: %s', err);
        }
      });
    });
    socket.on('endCourse', () => {
      dbSessions[this.id].endCourse((err) => {
        if (err) {
          debug('dbSession saveError failed: %s', err);
        }
      });
    });
    return super._bind(socket);
  }
  /**
   * Wird bei löschen einer Datei aufgerufen, löscht diese Datei auch in Datenbank
   * @param {Object} files Dateien
   * @param {Object} options Optionen
   * @return {Unknown} Rückgabe der super.onRm Funktion
   */
  onRm(files, options) {
    dbSessions[this.id].removeFiles(files, (err) => {
      if (err) {
        debug('dbSession removeFiles failed: %s', err);
      }
    });
    return super.onRm(files, options);
  }
  /**
   * Wird bei Beendung einer Sitzung aufgerufen (nach Ablauf des Timeouts)
   * @param {String} reason Grund der Beendigung
   * @return {Unknown} Rückgabe der super._destroy Funktion
   */
  _destroy(reason) {
    if (dbSessions[this.id]) {
      delete (dbSessions[this.id]);
    }
    return super._destroy(reason);
  }
}

/**
 * Erstellt den Server
 */
const source = new Sourcebox(Config.sourcebox.loopMount, Config.sourcebox.options);
const sourceboxServer = new Server(source, {
  session: CustomSession,
  auth: function handleAuth(socket, token) {
    if (!_.isString(token)) {
      throw new Error('invalid user token');
    }
    const id = token.substr(0, token.indexOf('_'));
    if (!dbSessions[id]) {
      throw new Error('invalid user token');
    } else if (dbSessions[id].token !== token) {
      throw new Error('invalid user token');
    }
    return id;
  },
  authTimeout: Config.sourceboxServer.authTimeout,
  sessionTimeout: Config.sourceboxServer.sessionTimeout,
  io: { serveClient: false },
});

tools.httpServerConfig(app);

const provider = new lti.Provider(Config.lti.consumer_key, Config.lti.consumer_secret);

app.post('/lti', (req, res) => {
  /**
   * Händelt gültige LTI Post Anfragen 
   */
  provider.valid_request(req, (err, isValid) => {
    if (err) {
      debug('provider valid_request failed: %s', err);
      res.sendStatus(403);
    } else if (!isValid) {
      res.sendStatus(422);
    } else {
      // console.log('req.body', req.body);
      const id = `${req.body.context_id}-${req.body.resource_link_id}-${req.body.user_id}`;
      const token = `${id}_${crypto.randomBytes(16).toString('hex')}`;

      dbSessions[id] = new DbSession(
        req.body.user_id,
        req.body.context_id,
        req.body.resource_link_id,
        token);
      const requiredTeacherRoles = ['Instructor'];
      let isTeacher = false;
      if (_.intersection(req.body.roles.split(','), requiredTeacherRoles).length > 0) {
        isTeacher = true;
      }
      dbSessions[id].createSession(isTeacher, (err2, files_, statistic) => {
        if (err2) {
          debug('dbSession createSession failed: %s', err2);
          res.sendStatus(403);
          return;
        }
        let files = files_;
        if (files.length === 0) {
          // No file -> send empty main.c
          const filename = 'main.c';
          const filenameClear = getSlug(filename);
          files = [{
            filename,
            filenameClear,
            icon: 'code',
          }];
        }
        res.render('index', {
          files,
          returnUrl: req.body.launch_presentation_return_url,
          globalOptions: {
            token,
            projectName: getSlug(_.get(req, 'body.resource_link_title', 'project'), { replacement: '_', lower: true }),
            maxNumberOfFiles: Config.database.maxNumberOfFiles,
          },
          isTeacher,
          isDebug: Config.debug,
          statistic,
        });
      });
    }
  });
});

sourceboxServer.attach(httpServer);
httpServer.listen(80);
