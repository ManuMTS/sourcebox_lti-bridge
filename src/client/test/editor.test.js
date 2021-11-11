const $ = require('jquery');
const pug = require('pug');
const getSlug = require('speakingurl');
const tools = require('../../server/lib/tools');
/* eslint-env browser */

const renderFunction = pug.compileFile('views/index.pug');
const helloWorld = `
#include<stdio.h>

int main() {
     printf("Hallo 1235123");
     return 0;
}
`;
const helloWorldConverted = tools.convertCode(helloWorld);
const filename = 'main.c';
const filenameClear = getSlug(filename);
const filenameRename = 'test.c';
const annotations = {
  'main.c': [{
    column: 5,
    row: 3,
    text: '"expected ‘;’ before ‘return’"',
    type: 'error',
  }],
};

const html = renderFunction({
  files: [{
    filename,
    filenameClear,
    content: helloWorldConverted,
  }],
});
document.body.innerHTML = html;

const Editor = require('../lib/workspace/editor');

let editor;
test('editor constructor test', () => {
  editor = new Editor();
  expect(editor).toBeDefined();
});

test('editor addWindow undefined parameters test', () => {
  expect(() => {
    editor.addWindow(undefined, filenameClear);
  }).toThrow();
  expect(() => {
    editor.addWindow(filename, undefined);
  }).toThrow();
});

test('editor addWindow test', () => {
  editor.addWindow(filename, filenameClear);
  const window = editor.windows[filename];
  expect(window).toBeDefined();
  const session = window.getSession();
  expect(session).toBeDefined();
  expect(session.getValue()).toBe(helloWorld);
});

test('editor renameWindow undefined paramaters test', () => {
  expect(() => {
    editor.renameWindow(undefined, filenameRename);
  }).toThrow();
  expect(() => {
    editor.renameWindow(filename, undefined);
  }).toThrow();
});

test('editor renameWindow test', () => {
  editor.renameWindow(filename, filenameRename);
  expect(editor.windows[filename]).toBeUndefined();
  const window = editor.windows[filenameRename];
  expect(window).toBeDefined();
  const session = window.getSession();
  expect(session).toBeDefined();
  expect(session.getValue()).toBe(helloWorld);
  editor.renameWindow(filenameRename, filename);
});

test('editor setReadOnly undefined paramaters test', () => {
  expect(() => {
    editor.setReadOnly(undefined);
  }).toThrow();
});

test('editor setReadOnly test', () => {
  editor.setReadOnly(true);
  expect(editor.windows[filename].getReadOnly()).toBeTruthy();
  editor.setReadOnly(false);
  expect(editor.windows[filename].getReadOnly()).toBeFalsy();
});

test('editor setAnnotations undefined paramaters test', () => {
  expect(() => {
    editor.setAnnotations(undefined);
  }).toThrow();
});

test('editor setAnnotations test', () => {
  editor.setAnnotations(annotations);
  expect(editor.windows[filename].getSession().getAnnotations()).toEqual(annotations[filename]);
});

test('editor setState undefined paramaters test', () => {
  expect(() => {
    editor.setState(undefined);
  }).toThrow();
});

test('editor setState unsaved test', () => {
  editor.setState('unsaved');
  expect(editor.windows[filename].getReadOnly()).toBeFalsy();
});

test('editor setState saving test', () => {
  editor.setState('saving');
  expect(editor.windows[filename].getReadOnly()).toBeTruthy();
});

test('editor setState saved test', () => {
  editor.setState('saved');
  expect(editor.windows[filename].getReadOnly()).toBeFalsy();
});

test('editor setState compiling test', () => {
  editor.setState('compiling');
  expect(editor.windows[filename].getReadOnly()).toBeTruthy();
});

test('editor setState compileError test', () => {
  editor.setState('compileError');
  expect(editor.windows[filename].getReadOnly()).toBeFalsy();
});

test('editor setState runnable test', () => {
  editor.setState('runnable');
  expect(editor.windows[filename].getReadOnly()).toBeFalsy();
});

test('editor setState running test', () => {
  editor.setState('running');
  expect(editor.windows[filename].getReadOnly()).toBeTruthy();
});
