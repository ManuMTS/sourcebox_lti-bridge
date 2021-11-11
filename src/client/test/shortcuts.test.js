const Shortcuts = require('../lib/workspace/shortcuts');

let shortcuts;
test('shortcuts constructor test', () => {
  shortcuts = new Shortcuts();
  expect(shortcuts).toBeDefined();
});
