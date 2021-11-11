/**
 * @file Hauptprogramm auf Clientseite für Kursleiter
 * @author Tobias Knobloch
 * @version 1.0.0
 */

/* eslint-env browser */

const Sourcebox = require('@sourcebox/web');
const GenerateDescription = require('./lib-teacher/generateDescription');
const TeacherButtons = require('./lib-teacher/teacherButtons');

const sourcebox = new Sourcebox(`${location.protocol}//${document.domain}`, {
  auth: globalOptions.token,
});
const teacherButtons = new TeacherButtons();

/**
 * Schließen eines Kurses (löschen aller Nutzerdaten)
 */
teacherButtons.on('endCourse', () => {
  sourcebox.socket.emit('endCourse');
});

new GenerateDescription(window.files);
