/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    transaction_id: { type: 'string', required: true },
    amount: { type: 'integer', required: true},
    currency: { type: 'string', required: true },
    transaction_type: { type: 'string', required: true },
    transaction_category: { type: 'string', required: true },
    timestamp: { type: 'string', required: true },
    merchant_name: { type: 'string' },
    description: { type: 'string' },
    transaction_classification: { type: 'string'},
    account: { model:'TLAccount', required: true },
    meta: { model: 'TLTransactionMeta' }
  },

};

