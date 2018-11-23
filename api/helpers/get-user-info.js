const {DataAPIClient} = require("truelayer-client");


// Have a wrapper around each TrueLayer call so we can time the call and handle possible errors
const trueLayerCallWrapper = async (methodToCall, params, debug = false, type = null, debugInfo = null) => {
  let result = null;
  let timing = null;
  let start = null;
  let response = null;

  if (debug) { 

    debugInfo[ type ] = {}
    start = Date.now(); }

  try {
    response = params.account_id ? 
      await methodToCall(params.access_token, params.account_id) :
      await methodToCall(params.access_token)
    //response = await method(...params);
  } catch (err) {
    if (debug) { 
      timing = Date.now() - start; 
      debugInfo [ type ].timing = timing;
      debugInfo [ type ].error = err;
    }

    result = {
      ... result, 
      err,
      status: 'fail',
      timing: debug ? timing : null
    }

    debugInfo [ type ].timing = timing;
  
    return result;
  }

  if (debug) { timing = Date.now() - start; }

  result = {
    ...response,
    status: 'success',
    timing: debug ? timing : null
  }

  return result;
}

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
    let debugInformation = {};
    try {
      // get personal information 
      let personalInfo = 
      (await trueLayerCallWrapper(
        DataAPIClient.getInfo,
        { 
          access_token: inputs.access_token
        },
        inputs.time,
        'getInfo',
        debugInformation));

      // get bank accounts
      let accounts = (await trueLayerCallWrapper(
        DataAPIClient.getAccounts, 
        {
          access_token: inputs.access_token
        },
        inputs.time,
        'accounts',
        debugInformation));

      let transactionsPerAccount = {};

      // for each bank account get transactions
      await Promise.all(await accounts.results.map(async (account) => {
        transactionsPerAccount[account.account_id] = 
        (await trueLayerCallWrapper(
          DataAPIClient.getTransactions,
          { 
            access_token: inputs.access_token,
            account_id: account.account_id 
          },
          inputs.time,
          'transactionsPerAccounts'.
          debugInformation));
      }));

      // get cards
      let cards = (await trueLayerCallWrapper(
        DataAPIClient.getCards, 
        {
          access_token: inputs.access_token
        },
        inputs.time,
        'cards',
        debugInformation));

      let transactionsPerCard = {};
      
      // for each card get transactions 
      await Promise.all(await cards.results.map(async (card) => {
        transactionsPerCard[card.account_id] = 
        (await trueLayerCallWrapper(
          DataAPIClient.getCardTransactions,
          {
            access_token: inputs.access_token,
            account_id: card.account_id,
          },
          inputs.time,
          'transactionsperCard',
          
          debugInformation));
      }));

      // build result object
      let userInfo = {
        personalInfo,
        accounts,
        transactionsPerAccount,
        cards,
        transactionsPerCard,
      }

      if(inputs.time) userInfo.debugInfo = debugInformation;

      return userInfo;
    } catch (err) {
      return debugInformation;
    }
  } 
};

