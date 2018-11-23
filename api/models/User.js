/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    userId: {type: 'string', required: true},
    accessToken: { type: 'string', columnType: 'varchar(1280)', required: true},
    refreshToken: { type: 'string', required: true},
    email: { type: 'string' },
    fullName: { type: 'string' }
  },
};

  