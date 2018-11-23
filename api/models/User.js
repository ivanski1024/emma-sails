/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    user_id: {type: 'string', required: true},
    access_token: { type: 'string', columnType: 'varchar(1280)', required: true},
    refresh_token: { type: 'string', required: true},
    email: { type: 'string' },
    full_name: { type: 'string' }
  },
};

  