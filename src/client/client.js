/**
 * @file Hauptprogramm auf Clientseite für Nutzer {@link module:Client}
 * @author Michael Ebert, Tobias Knobloch
 * @version 1.0.0
 */

/* eslint-env browser */

/**
 * Hauptprogramm auf Clientseite
 * @module Client
 */

const $ = require('jquery');
const StateMachine = require('javascript-state-machine');
const Sourcebox = require('@sourcebox/web');

const Project = require('./lib/project/project');
const Workspace = require('./lib/workspace/workspace');

window.$ = $;
window.jQuery = $;
require('bootstrap');

const sourcebox = new Sourcebox(`${location.protocol}//${document.domain}`, {
  auth: globalOptions.token,
});

window.files = {};

const project = new Project(sourcebox, globalOptions.projectName, 'c', window.files);
const workspace = new Workspace(window.files);

// ------------------
// Statemachine
// ------------------

const fsm = new StateMachine({
  init: 'unsaved',
  transitions: [
    { name: 'save', from: 'unsaved', to: 'saving' },
    { name: 'saved', from: 'saving', to: 'saved' },
    { name: 'compile', from: 'saved', to: 'compiling' },
    { name: 'compileSuccess', from: 'compiling', to: 'runnable' },
    { name: 'compileFailure', from: 'compiling', to: 'compileError' },
    { name: 'run', from: 'runnable', to: 'running' },
    { name: 'stop', from: 'running', to: 'stopping' },
    { name: 'stopped', from: ['running', 'stopping'], to: 'runnable' },
    { name: 'edit', from: ['saved', 'compileError', 'runnable', 'unsaved'], to: 'unsaved' },
  ],
  methods: {
    onEnterState(state) {
      workspace.setState(state.to);
    },
  },
});

// ------------------
// Workspace
// ------------------

// Handle transition requests from workspace
['save', 'edit', 'compile', 'run', 'stop'].forEach((event) => {
  workspace.on(event, () => {
    if (fsm.can(event)) {
      workspace.startAction(event);
      fsm[event]();
      if (project[event]) {
        const stream = project[event]();
        if (stream) {
          stream.pipe(workspace.terminal.session, { end: false }).pipe(stream);
        }
      }
    }
  });
});

// Handle events from workspace (which are not affecting state machine)
['download', 'renameFile', 'removeFile'].forEach((event) => {
  workspace.on(event, (data) => {
    project[event](data);
  });
});

// ------------------
// Project
// ------------------

// Handle transition requests from project
['saved', 'stopped', 'compileFailure', 'compileSuccess'].forEach((event) => {
  project.on(event, () => {
    fsm[event]();
  });
}, this);

// Handle events from project (which are not affecting state machine)
['annotations'].forEach((event) => {
  project.on(event, (data) => {
    workspace[event](data);
  });
});

// Save program on startup
fsm.save();
project.save();

// ------------------
// Other Stuff
// ------------------

// Warn user, if they ask to close window without saving
window.onbeforeunload = () => {
  if (fsm.state === 'unsaved') {
    return 'Leaving without saving? Sure?';
  }
  return undefined;
};
