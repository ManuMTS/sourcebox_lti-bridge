const $ = require('jquery');
const pug = require('pug');

/* eslint-env browser */

const renderFunction = pug.compileFile('views/index.pug');

const html = renderFunction({
  files: [],
});
document.body.innerHTML = html;

const Buttons = require('../lib/workspace/buttons');

let buttons;
test('button constructor test', () => {
  buttons = new Buttons();
  expect(buttons).toBeDefined();
});

// Test that all buttins emit events

test('buttons press download button', () => {
  spyOn(buttons, 'emit');
  $('#download').click();
  expect(buttons.emit).toHaveBeenCalledWith('download');
});

test('buttons press save button', () => {
  spyOn(buttons, 'emit');
  $('#save').click();
  expect(buttons.emit).toHaveBeenCalledWith('save');
});

test('buttons press compile button', () => {
  spyOn(buttons, 'emit');
  $('#compile').click();
  expect(buttons.emit).toHaveBeenCalledWith('compile');
});

test('buttons press run button', () => {
  spyOn(buttons, 'emit');
  $('#run').click();
  expect(buttons.emit).toHaveBeenCalledWith('run');
});

test('buttons press stop button', () => {
  spyOn(buttons, 'emit');
  $('#stop').click();
  expect(buttons.emit).toHaveBeenCalledWith('stop');
});

test('buttons press newFile button', () => {
  spyOn(buttons, 'emit');
  $('#newFile').click();
  expect(buttons.emit).toHaveBeenCalledWith('newFile');
});

test('buttons press rename button', () => {
  spyOn(buttons, 'emit');
  $('#rename').click();
  expect(buttons.emit).toHaveBeenCalledWith('rename');
});

test('buttons press remove button', () => {
  spyOn(buttons, 'emit');
  $('#remove').click();
  $('[data-apply="confirmation"]').click();
  expect(buttons.emit).toHaveBeenCalledWith('remove');
});

// Test, that all buttons are correctly en- / disabled
// @TODO: add check if elements are visible, but jsdom cannot check this currently, 
// see https://github.com/tmpvar/jsdom/issues/1048

test('buttons resetButtons test', () => {
  buttons.resetButtons();
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState undefined test', () => {
  expect(() => {
    buttons.setState(undefined);
  }).toThrow();
});

test('buttons setState unsaved test', () => {
  buttons.setState('unsaved');
  expect($('#save')[0].disabled).toBeFalsy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState saving test', () => {
  buttons.setState('saving');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState saved test', () => {
  buttons.setState('saved');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeFalsy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState compiling test', () => {
  buttons.setState('compiling');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState compileFailure test', () => {
  buttons.setState('compileFailure');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState runnable test', () => {
  buttons.setState('runnable');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeFalsy();
  expect($('#stop')[0].disabled).toBeTruthy();
});

test('buttons setState running test', () => {
  buttons.setState('running');
  expect($('#save')[0].disabled).toBeTruthy();
  expect($('#compile')[0].disabled).toBeTruthy();
  expect($('#run')[0].disabled).toBeTruthy();
  expect($('#stop')[0].disabled).toBeFalsy();
});
