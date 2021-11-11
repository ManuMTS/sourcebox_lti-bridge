/**
 * @file Beeinhaltet die Klasse {@link DbSession}
 * @author Tobias Knobloch
 * @version 1.0.0
 */

const MongoClient = require('mongodb').MongoClient;
const getSlug = require('speakingurl');
const _ = require('lodash');
const Config = require('config');
const tools = require('./tools');

/**
 * Klasse, welche alle Datenbankaktionen händelt
 */
class DbSession {
  /**
   * Initiert eine Datanbank Sitzung zum Speichern und lesen von Daten aus der Datenbank
   * @constructor
   * @param {String} userId - Eine einzigartige ID des Benutzers, welcher das Tool benutzt
   * @param {String} contextId - Eine einzigartige ID des Kurses, in dem das Tool eingebunden wird
   * @param {String} resourceLinkId - Eine enzigarte ID der Einbindung des Tools 
   * @param {String} token - Token, welcher bei gültiger LTI Autentifizierung erstellt wird 
   * innerhalb eines Kurses
   */
  constructor(userId, contextId, resourceLinkId, token) {
    this.userId = userId;
    this.contextId = contextId;
    this.resourceLinkId = resourceLinkId;
    this.isTeacher = false;
    this.token = token;
    this.mongoUrl = Config.database.url;
    if (!_.isString(userId) ||
      !_.isString(contextId) ||
      !_.isString(resourceLinkId) ||
      !_.isString(token) ||
      !_.isString(this.mongoUrl)) {
      throw new Error('DbSession constructor: invalid parameter exception');
    }
  }
  /**
   * Eine neue Sitzung wird erstellt. Es wird geprüft ob bereits eine Datei gespeichert wurde. 
   * Falls ja wird diese im Callback übergeben 
   * @param {Boolean} isTeacher True, wenn Kursleiterrechte vorhanden
   * @param {Requester~requestCallback} callback Wird aufgerufen, sobald Sitzung erstellt wurde. 
   * Mit file als Übergabeparameter
   * @return {undefined}
   */
  createSession(isTeacher, callback = _.noop) {
    if (!_.isBoolean(isTeacher) || !_.isFunction(callback)) {
      throw new Error('DbSession createSession: invalid parameter exception');
    }
    this.isTeacher = isTeacher;
    let userId = this.userId;
    if (this.isTeacher) {
      userId = 0;
    }
    const selector = {
      userId,
      contextId: this.contextId,
      resourceLinkId: this.resourceLinkId,
    };
    const self = this;
    MongoClient.connect(this.mongoUrl, (err, db) => {
      if (err) {
        db.close();
        callback(err);
      }
      const collection = db.collection('files');
      const fields = {
        content: 1,
        filename: 1,
        filenameClear: 1,
      };
      collection.find(selector, fields).toArray((err2, files) => {
        if (err2) {
          db.close();
          callback(err2);
        }
        if (isTeacher) {
          // User is teacher -> send him statistic
          self._createStatistik(db, (err3, statistic) => {
            db.close();
            callback(err3, files, statistic);
          });
        } else if (!files.length) {
          // No teacher and first session -> send him draft from teacher
          selector.userId = 0;
          collection.find(selector, fields).toArray((err3, filesDraft) => {
            db.close();
            callback(err3, filesDraft);
          });
        } else {
          // Send user his files
          db.close();
          callback(err2, files);
        }
      });
    });
  }

  /**
   * Speichert eine Datei in die offene Sitzung.
   * @param {String} filename Dateiname
   * @param {Buffer} buffer Dateiinhalt
   * @param {Callback} callback Callback Funktion mit dem Parameter err
   * @return {undefined} 
   */
  saveFile(filename, buffer, callback = _.noop) {
    if (!_.isString(filename) || !_.isBuffer(buffer) || !_.isFunction(callback)) {
      throw new Error('DbSession saveFile: invalid parameter exception');
    }
    let userId = this.userId;
    if (this.isTeacher) {
      userId = 0;
    }
    const selector = {
      userId,
      contextId: this.contextId,
      resourceLinkId: this.resourceLinkId,
      filename,
    };
    MongoClient.connect(this.mongoUrl, (err, db) => {
      if (err) {
        callback(err);
      }
      const collection = db.collection('files');

      collection.findOne(selector, { fields: { _id: 1 } }, (err2, doc) => {
        if (err2) {
          db.close();
          callback(err2);
        }
        if (!doc) {
          const data = Object.assign(selector, {
            filenameClear: getSlug(filename),
            createdAt: new Date(),
            modifiedAt: new Date(),
            content: tools.convertCode(buffer.toString()),
          });
          collection.insertOne(data, (err3) => {
            db.close();
            callback(err3);
          });
        } else {
          collection.updateOne(selector, {
            $set: {
              content: tools.convertCode(buffer.toString()),
              modifiedAt: new Date(),
            },
          }, (err3) => {
            db.close();
            callback(err3);
          });
        }
      });
    });
  }

  /**
   * Speichert einen Fehler in die offene Sitzung.
   * @param {String} errorMessage Fehlermeldung
   * @param {Callback} callback Callback Funktion mit dem Parameter err
   * @return {undefined}
   */
  saveError(errorMessage, callback) {
    if (!_.isString(errorMessage) || !_.isFunction(callback)) {
      throw new Error('DbSession saveError: invalid parameter exception');
    }
    const selector = {
      contextId: this.contextId,
      resourceLinkId: this.resourceLinkId,
      errorMessage,
    };
    MongoClient.connect(this.mongoUrl, (err, db) => {
      if (err) {
        callback(err);
      }
      const collection = db.collection('errors');
      collection.findOne(selector, { fields: { _id: 1, count: 1 } }, (err2, doc) => {
        if (err2) {
          db.close();
          callback(err2);
        }
        if (!doc) {
          const data = Object.assign(selector, {
            count: 1,
          });
          collection.insertOne(data, (err3) => {
            db.close();
            callback(err3);
          });
        } else {
          const count = doc.count + 1;
          collection.updateOne(selector, {
            $set: {
              count,
            },
          }, (err3) => {
            db.close();
            callback(err3);
          });
        }
      });
    });
  }

  /**
   * Entfernt Dateien
   * @param {Array} files Dateien
   * @param {Callback} callback Callback Funktion mit dem Parameter err
   * @return {undefined}
   */
  removeFiles(files, callback = _.noop) {
    let filesArray = files;
    if (_.isString(files)) {
      filesArray = [files];
    }
    if (!_.isArray(filesArray) || !_.isFunction(callback)) {
      throw new Error('DbSession removeFiles: invalid parameter exception');
    }
    _.each(filesArray, (file) => {
      const filename = file.substr(file.lastIndexOf('/') + 1);
      let userId = this.userId;
      if (this.isTeacher) {
        userId = 0;
      }
      const selector = {
        userId,
        contextId: this.contextId,
        resourceLinkId: this.resourceLinkId,
        filename,
      };
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          callback(err);
        }
        const collection = db.collection('files');
        collection.remove(selector, (err2) => {
          db.close();
          callback(err2);
        });
      });
    });
  }

  /**
   * Schließt einen Kurs (Löschen aller Nutzerdaten)
   * @param {Callback} callback Callback Funktion mit dem Parameter err
   * @return {undefined}
   */
  endCourse(callback = _.noop) {
    if (!_.isFunction(callback)) {
      throw new Error('DbSession endCourse: invalid parameter exception');
    }
    if (!this.isTeacher) {
      throw new Error('DbSession endCourse: not allowed!');
    } else {
      const selector = {
        contextId: this.contextId,
        resourceLinkId: this.resourceLinkId,
      };
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          callback(err);
        }
        const filesCollection = db.collection('files');
        filesCollection.remove(selector, (err2) => {
          if (err2) {
            db.close();
            callback(err2);
          }
          const errorsCollection = db.collection('errors');
          errorsCollection.remove(selector, (err3) => {
            db.close();
            callback(err3);
          });
        });
      });
    }
  }
  /**
   * Gibt die Anzahl an bereits gespeicherten Datein zurück
   * @param {Callback} callback Callback Funktion mit den Parametern err, result
   * @return {undefined}
   */
  numberOfFiles(callback) {
    MongoClient.connect(this.mongoUrl, (err, db) => {
      if (err) {
        callback(err);
      }
      const filesCollection = db.collection('files');
      let userId = this.userId;
      if (this.isTeacher) {
        userId = 0;
      }
      const selector = {
        userId,
        contextId: this.contextId,
        resourceLinkId: this.resourceLinkId,
      };
      const cursor = filesCollection.find(selector);
      cursor.count((err2, result) => {
        db.close();
        if (err2) {
          callback(err2);
        }
        callback(null, result);
      });
    });
  }

  /**
   * Erstellt Statistiken
   * @private
   * @param {MongoDatabase} db Mongo Datenbank 
   * @param {Callback} callback Callback Funktion mit dem Parameter err
   * @return {undefined}
   */
  _createStatistik(db, callback) {
    const filesCollection = db.collection('files');
    const self = this;
    filesCollection.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ], (err, result) => {
      if (err) {
        callback(err);
      }
      const usersCount = result.length;
      const errorsCollection = db.collection('errors');
      const selector = {
        contextId: self.contextId,
        resourceLinkId: self.resourceLinkId,
      };
      const fields = {
        count: 1,
        errorMessage: 1,
      };
      errorsCollection.find(selector, fields, {
        limit: 10,
        sort: { count: -1 },
      }).toArray((err2, items) => {
        if (err2) {
          callback(err2);
        }
        callback(null, {
          usersCount,
          errors: items,
        });
      });
    });
  }
}

module.exports = DbSession;
