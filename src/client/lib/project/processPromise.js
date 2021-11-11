const Promise = require('bluebird');

/**
 * Erstellt einen Bluebird promise
 * @param {Object} process Auszuführender Prozess
 * @param {Boolean} cleanExit Soll Prozess sauber beendet werden?
 * @return {Method} Bluebird Promise
 */
function processPromise(process, cleanExit) {
  return new Promise(((resolve, reject) => {
    process.on('error', (err) => {
      reject(err);
    });

    process.on('exit', (code, signal) => {
      if (code === 0 || !cleanExit) {
        resolve();
      } else {
        const error = new Error(`Command failed: ${process.spawnfile}`);
        error.code = code;
        error.signal = signal;
        reject(error);
      }
    });
  }));
}

exports = processPromise;
module.exports = exports;
