const Config = require('config');
const oauth = require('lti/target/lib/oauth');
const _ = require('lodash');

module.exports = {
  'Authentification Test': (client) => {
    const apiUrl = `${Config.serverUrl}/lti`;
    const params = {
      user_id: '2',
      context_id: '2',
      resource_link_id: '2',
      roles: 'Instructor',
      resource_link_title: 'HelloWorld_local',
      lti_version: 'LTI-1p0',
      lti_message_type: 'basic-lti-launch-request',
      launch_presentation_return_url: 'http://test-return-url.com',
    };
    client.apiPost(apiUrl, params, (response) => {
      client.assert.equal(response.statusCode, 403, '403 OK');
      client.end();
    });
    const oauthParams = oauth.authorization('POST', apiUrl, params, Config.lti.consumer_key, Config.lti.consumer_secret);
    client.apiPost(apiUrl, _.extend(oauthParams.value, params), (response) => {
      client.assert.equal(response.statusCode, 200, '200 OK');
      client.end();
    });
  },

};
