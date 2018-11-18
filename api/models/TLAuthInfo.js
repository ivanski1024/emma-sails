/**
 * TLAuthInfo.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    access_token: { type: 'string', required: true},
    refresh_token: { type: 'string', required: true},
  },

};
