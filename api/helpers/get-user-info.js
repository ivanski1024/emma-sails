const {DataAPIClient} = require("truelayer-client");

module.exports = {
  friendlyName: 'Get user info',
  description: 'Extracts user information from TrueLayer (Personal Information, Accounts, Transactions)',
  inputs: {
    access_token: {
      type: 'string',
      description: 'The access_token of the user',
      required: true
    },
    time: {
      type: 'boolean',
      description: 'Should this be timed'
    }
  },
  exits: {
    success: {
      outputFriendlyName: 'User info',
    },
  },
  fn: async function (inputs) {
    try {
      // get personal information 
      let personalInfo = 
      (await sails.helpers.trueLayerCallWrapper( DataAPIClient.getInfo, { access_token: inputs.access_token }));

      // get bank accounts
      let accounts = 
      (await sails.helpers.trueLayerCallWrapper( DataAPIClient.getAccounts, { access_token: inputs.access_token }));

      let transactionsPerAccount = {};

      // for each bank account get transactions
      await Promise.all(await accounts.results.map(async (account) => {
        transactionsPerAccount[account.account_id] = 
        (await sails.helpers.trueLayerCallWrapper( DataAPIClient.getTransactions, { 
            access_token: inputs.access_token,
            account_id: account.account_id 
          }));
      }));

      // get cards
      let cards = 
      (await sails.helpers.trueLayerCallWrapper( DataAPIClient.getCards, { access_token: inputs.access_token }));

      let transactionsPerCard = {};
      
      // for each card get transactions 
      await Promise.all(await cards.results.map(async (card) => {
        transactionsPerCard[card.account_id] = 
        (await sails.helpers.trueLayerCallWrapper( DataAPIClient.getCardTransactions, {
            access_token: inputs.access_token,
            account_id: card.account_id,
          }));
      }));

      // build result object
      let userInfo = {
        personalInfo,
        accounts,
        transactionsPerAccount,
        cards,
        transactionsPerCard,
      }

      return userInfo;
    } catch (err) {
      return err.raw;
    }
  } 
};

