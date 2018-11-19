/**
 * TLAccount.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    transactions: { collection: 'TLTransaction', via : 'account'},
    user: { model: 'User', required: true },
    update_timestamp: { type: 'string', required: true },
    account_id: { type: 'string', required: true },
    account_type: { type: 'string', required: true },
    display_name: { type: 'string', required: true },
    currency: { type: 'string', required: true },
    account_number: { model: 'TLAccountNumber', unique: true },
    provider: { model: 'TLProvider', unique: true}
  },

};

