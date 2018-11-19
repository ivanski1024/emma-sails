/**
 * TLAccountNumber.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    swift_bic: { type: 'string', required: true },
    number: { type: 'string', required: true },
    sort_code: { type: 'string', required: true }
  },

};

