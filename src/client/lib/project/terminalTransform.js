const stream = require('stream');
const util = require('util');

/**
 * terminal needs CR LF line terminators
 * @return {undefined}
 */
function TerminalTransform() {
  TerminalTransform.super_.call(this);
}

util.inherits(TerminalTransform, stream.Transform);

TerminalTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  this.push(chunk.toString().replace(/\n/g, '\r\n'));
  callback();
};

module.exports = TerminalTransform;
