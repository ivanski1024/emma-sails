/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const {AuthAPIClient, DataAPIClient} = require("truelayer-client");
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const validator = require('validator');

const redirect_uri = "http://localhost:1337/callback";
const scopes = ["info", "accounts", "balance", "transactions", "offline_access", "cards"]

// Create TrueLayer client instance
const client = new AuthAPIClient({
  client_id: sails.config.client_id,
  client_secret: sails.config.client_secret
});

const refreshTokenIfExpired = async function (user) {

  let tokenValid = await DataAPIClient.validateToken(user.access_token)

  console.log(tokenValid);
  if(!tokenValid) {

    const newClient = new AuthAPIClient({
      client_id: sails.config.client_id,
      client_secret: sails.config.client_secret
    });

    let newTokens = await newClient.refreshAccessToken(user.refresh_token);

    let updatedUser = (await User.update({user_id: user.user_id}).set({access_token: newTokens.results.access_token, refresh_token: newTokens.results.refresh_token})).fetch();

    return updatedUser;
  }

  return;
}
const getUser = async function(req, res) {
  let userId = req.query.userId;
  if(!userId) { 
    return res.badRequest('userId parameter required');
  }

  if(!validator.isUUID(userId)) { 
    return res.badRequest('userId should be a uuid');
  }

  let user = await User.find({user_id: userId});

  if(!user && !user.length != 1) {
    return res.badRequest('invalid user id');
  }

  return user[0];
}

module.exports = {
  root: function(req, res) {
    res.redirect('http://localhost:1337/register');
  },
  register: function(req, res){
    const nonce = crypto.randomBytes(12);
    const authURL = client.getAuthUrl(redirect_uri, scopes, nonce, null, null, true);
    res.redirect(authURL);
  },
  callback: async function(req, res) {
    try {
      // get tokens
      const tokens = await client.exchangeCodeForToken(redirect_uri, req.query.code);

      // generate unique user id
      const user_id = uuidv4();

      // create user
      const user = await User.create({...tokens, user_id: user_id}).fetch();

      // get accounts for user
      const accounts = (await DataAPIClient.getAccounts(tokens.access_token)).results;

      // for each account
      accounts.map(async (account) => {

        // get transactions
        let transactionsForAccount = (await DataAPIClient.getTransactions(tokens.access_token, account.account_id)).results;

        // parse transaction
        transactionsForAccount = transactionsForAccount.map((transaction) => {
          transaction = {
            transaction_id: transaction.transaction_id,
            account_id: account.account_id,
            user_id: user_id,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_type: transaction.transaction_type,
            transaction_category: transaction.transaction_category,
            timestamp: transaction.timestamp,
            merchant_name: transaction.merchant_name ? transaction.merchant_name : '',
            description: transaction.description ? transaction.description : '',
            transaction_classification: transaction.transaction_classification ? transaction.transaction_classification.join(' ') : ''
          }

          return transaction;
        });

        // bulk save transactions per account
        let savedTransactionsForAccount = await TLTransaction.createEach(transactionsForAccount).fetch();
        
        return account;
      });
      
      res.ok(user_id);
    } catch (err) {
      res.ok(err);
    }
  },
  getTransactions: async function(req, res) {
    let user = await getUser(req, res);

    const transactions = await TLTransaction.find({user_id: user.user_id});
    let result = {}

    await transactions.map(t => {
      if(!result[t.account_id]) {
        result[t.account_id] = []
      }

      result[t.account_id].push(t);
    })

    return res.ok(result);
  },
  getDebugInformation: async function (req, res) {
    let user = await getUser(req, res);

    let refreshedUser = null;

    try {
      refreshedUser = await refreshTokenIfExpired(user);
    } catch (err) {
      console.log(err)
      res.serverError('Error when refreshing access token');
    }
    
    if (refreshedUser) { user = refreshedUser; }

    let result = {};
    let start = Date.now();

    let accountsCallResult = await DataAPIClient.getAccounts(user.access_token);

    result['accountsCall'] = {
      executionTime: (Date.now() - start) + 'ms.'
    }

    if(accountsCallResult.error) {
      result.accountsCall['error'] = accountsCallResult.error;
    }

    if (accountsCallResult.results) {
      let accounts = accountsCallResult.results;
      accounts.map(async (account) => {
        start = Date.now();

        let transactionsCallResult = await DataAPIClient.getTransactions(user.access_token, account.account_id)
        
        result['transactionsCall'] = {
          executionTime: (Date.now() - start) + 'ms.'
        }
 
        if(transactionsCallResult.error) {
          result.transactionsCallResult['error'] = accountsCallResult.error;
        }
      })
    }

    return res.ok(result);
  }
};

