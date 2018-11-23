const { DataAPIClient } = require("truelayer-client");

module.exports = {
  friendlyName: "Get user info",
  description:
    "Extracts user information from TrueLayer (Personal Information, Accounts, Transactions)",
  inputs: {
    access_token: {
      type: "string",
      description: "The access_token of the user",
      required: true
    },
    time: {
      type: "boolean",
      description: "Should this be timed"
    }
  },
  exits: {
    success: {
      outputFriendlyName: "User info"
    }
  },
  fn: async function(inputs) {
    try {
      let accessToken = inputs.access_token;

      // get personal information
      let personalInfo = await sails.helpers.trueLayerCallWrapper(
        DataAPIClient.getInfo,
        { accessToken }
      );

      // get bank accounts
      let accounts = await sails.helpers.trueLayerCallWrapper(
        DataAPIClient.getAccounts,
        { accessToken }
      );

      let transactionsPerAccount = {};

      // for each bank account get transactions
      await Promise.all(
        await accounts.results.map(async account => {
          let accountId = account.account_id;
          transactionsPerAccount[
            account.account_id
          ] = await sails.helpers.trueLayerCallWrapper(
            DataAPIClient.getTransactions,
            { accessToken, accountId }
          );
        })
      );

      // get cards
      let cards = await sails.helpers.trueLayerCallWrapper(
        DataAPIClient.getCards,
        { accessToken }
      );

      let transactionsPerCard = {};

      // for each card get transactions
      await Promise.all(
        await cards.results.map(async card => {
          let accountId = card.account_id;
          transactionsPerCard[
            accountId
          ] = await sails.helpers.trueLayerCallWrapper(
            DataAPIClient.getCardTransactions,
            { accessToken, accountId }
          );
        })
      );

      // build result object
      let userInfo = {
        personalInfo,
        accounts,
        transactionsPerAccount,
        cards,
        transactionsPerCard
      };

      return userInfo;
    } catch (err) {
      return err.raw;
    }
  }
};
