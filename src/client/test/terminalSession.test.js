const TerminalSession = require('../lib/workspace/terminalSession');

let terminalSession;
test('terminalSession constructor test', () => {
  terminalSession = new TerminalSession();
  expect(terminalSession).toBeDefined();
});

test('terminalSession startAction undefined paramaters test', () => {
  expect(() => {
    terminalSession.startAction(undefined);
  }).toThrow();
});
