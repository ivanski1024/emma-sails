/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    transactionId: { type: 'string', required: true },
    accountId: { type: 'string', required: true},
    userId: { type: 'string', required: true},
    amount: { type: 'number', required: true},
    currency: { type: 'string', required: true },
    transactionType: { type: 'string', required: true },
    transactionCategory: { type: 'string', required: true },
    timestamp: { type: 'string', required: true },
    merchantName: { type: 'string' },
    description: { type: 'string' },
    transactionClassification: { type: 'string'},
    parrentType: { type: 'string' }
  },
};

