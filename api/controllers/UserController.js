/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const {AuthAPIClient, DataAPIClient} = require("truelayer-client");
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

const redirect_uri = sails.config.custom.baseUrl + "callback";
        
// Create TrueLayer client instance           
const client = new AuthAPIClient({
  client_id: sails.config.client_id,
  client_secret: sails.config.client_secret
});


module.exports = {
  root: function(req, res) {
    const nonce = crypto.randomBytes(12);
    const authURL = client.getAuthUrl(redirect_uri, sails.config.custom.trueLayer.scopes, nonce, null, null, sails.config.custom.trueLayer.enableMock);
    res.redirect(authURL);
  },
  callback: async function(req, res) {
    // get tokens
    const tokens = await client.exchangeCodeForToken(redirect_uri, req.query.code);

    let userInfo = null;
    
    // generate unique user id
    const user_id = uuidv4();

    // create user
    await User.create({...tokens, user_id});
    
    // retrieve user info from TrueLayer
    try {
        userInfo = await sails.helpers.getUserInfo(tokens.access_token);
    } catch (err) {
      return res.serverError(err);
    }

    // update user
    await User.update({user_id}).set({...tokens, user_id: user_id, full_name: userInfo.personalInfo.results[0].full_name, email: userInfo.personalInfo.results[0].emails[0] }).fetch();

    // for each account
    userInfo.accounts.results.map(async (account) => {

      // for each transaction
      let transactions = await Promise.all(userInfo.transactionsPerAccount[account.account_id].results.map(async (transaction) => {
        // parse transaction
          return {
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
            transaction_classification: transaction.transaction_classification ? transaction.transaction_classification.join(' ') : '',
            bank_or_card: 'bank'
          }
        }));
          
        // bulk save transactions per account
        await TLTransaction.createEach(transactions).fetch();
    });

    // for each account
    userInfo.cards.results.map(async (card) => {

      // for each transaction
      let transactions = await Promise.all(userInfo.transactionsPerCard[card.account_id].results.map(async (transaction) => {

        // parse transaction
          return {
            transaction_id: transaction.transaction_id,
            account_id: card.account_id,
            user_id: user_id,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_type: transaction.transaction_type,
            transaction_category: transaction.transaction_category,
            timestamp: transaction.timestamp,
            merchant_name: transaction.merchant_name ? transaction.merchant_name : '',
            description: transaction.description ? transaction.description : '',
            transaction_classification: transaction.transaction_classification ? transaction.transaction_classification.join(' ') : '',
            bank_or_card: 'card'
          }
        }));

      // bulk save transactions per account
      await TLTransaction.createEach(transactions).fetch();
    })

    res.ok({status: 'Success', code: 200, result: {userId: user_id}});
  },
  getTransactions: async function(req, res) {
    let user = await sails.helpers.getUser(req.query.userId);

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
    let user = await sails.helpers.getUser(req.query.userId);

    try {
      user = await sails.helpers.refreshTokenIfExpired(user, client);
    } catch (err) {
      return res.serverError({status: 'Failed', code: 500, error: 'token_refresh_error', message: 'Error from token refreshing', internalError: err});
    }

    let info = await sails.helpers.getUserInfo(user.access_token);
    return res.ok(info);
  }
};

