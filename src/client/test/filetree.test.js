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
const files = {};
files[filename] = helloWorldConverted;
const filenameClear = getSlug(filename);
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
  globalOptions: {
    projectName: 'testprogram',
  },
});
document.body.innerHTML = html;

const Filetree = require('../lib/workspace/filetree');

let filetree;
test('filetree constructor undefined parameter test', () => {
  expect(() => {
    filetree = new Filetree(undefined);
  }).toThrow();
});

test('filetree constructor test', () => {
  filetree = new Filetree(files);
  expect(filetree).toBeDefined();
});

test('filetree setAnnotations undefined paramaters test', () => {
  expect(() => {
    filetree.setAnnotations(undefined);
  }).toThrow();
});

test('filetree setAnnotations test', () => {
  filetree.setAnnotations(annotations);
  expect($(`#${filenameClear}_tree_anchor`).hasClass('hasError')).toBeTruthy();
});

test('filetree setState undefined paramaters test', () => {
  expect(() => {
    filetree.setState(undefined);
  }).toThrow();
});

test('filetree setState unsaved test', () => {
  filetree.setState('unsaved');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeTruthy();
});

test('filetree setState saving test', () => {
  filetree.setState('saving');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeTruthy();
});

test('filetree setState saved test', () => {
  filetree.setState('saved');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeFalsy();
});

test('filetree setState compiling test', () => {
  filetree.setState('compiling');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeFalsy();
});

test('filetree setState compileError test', () => {
  filetree.setState('compileError');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeFalsy();
});

test('filetree setState runnable test', () => {
  filetree.setState('runnable');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeFalsy();
});

test('filetree setState running test', () => {
  filetree.setState('running');
  expect($('#project_root_anchor').hasClass('unsaved')).toBeFalsy();
});
