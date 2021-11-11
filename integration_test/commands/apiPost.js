/* eslint require-jsdoc: 'off' */
// Source of this snippet: https://github.com/nightwatchjs/nightwatch/issues/1541
const util = require('util');
const events = require('events');
const request = require('request');

function apiPost() {}

util.inherits(apiPost, events.EventEmitter);

apiPost.prototype.command = function command(apiUrl, postBody, success) {
  const options = {
    uri: apiUrl,
    method: 'POST',
    json: postBody,
  };
  request(options, (error, response) => {
    if (error) {
      console.log(error);
      return;
    }
    success(response);
    this.emit('complete');
  });
};

module.exports = apiPost;
