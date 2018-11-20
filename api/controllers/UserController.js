/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const {AuthAPIClient, DataAPIClient} = require("truelayer-client");
const crypto = require('crypto');

const redirect_uri = "http://localhost:1337/callback";
const scopes = ["info", "accounts", "balance", "transactions", "offline_access", "cards"]

// Create TrueLayer client instance
const client = new AuthAPIClient({
    "client_id": "emmatech-owm9",
    "client_secret": "ito9uvheyfgaaya6da4eq"
});

module.exports = {
  root: function(req, res) {
    res.redirect('http://localhost:1337/register');
  },
  register: function(req, res){
    const nonce = crypto.randomBytes(12);
    const authURL = client.getAuthUrl(redirect_uri, scopes, nonce, null, null, true);
    res.redirect(authURL);
  },
  callback: async function(req,res){
    // get tokens
    const tokens = await client.exchangeCodeForToken(redirect_uri,  req.query.code);
    
    // create user
    const user = await User.create(tokens).fetch();

    // get accounts for user
    const accounts = (await DataAPIClient.getAccounts(tokens.access_token)).results;

    let savedTransactionsCount = 0;

    await Promise.all(accounts.map(async (account) => {
      let transactionsForAccount = (await DataAPIClient.getTransactions(tokens.access_token, account.account_id)).results;

      transactionsForAccount = await Promise.all(transactionsForAccount.map((transaction) => {
        transaction = {
          transaction_id: transaction.transaction_id,
          account_id: account.account_id,
          user_id: user.id,
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
      }))

      // bulk save transactions per account
      let savedTransactionsForAccount = await TLTransaction.createEach(transactionsForAccount).fetch();

      savedTransactionsCount += savedTransactionsForAccount.length;
      
      return account;
    }));
    
    res.ok(`Saved ${savedTransactionsCount} transactions for this user`);
  },
  getTransactions: async function(req, res) {
    let userId = req.query.userId;
    let result = {}

    const transactions = await TLTransaction.find({user_id: userId});

    await Promise.all(transactions.map(t => {
      if(!result[t.account_id]) {
        result[t.account_id] = []
      }

      result[t.account_id].push(t);
    }))

    res.ok(result);


    // TODO: Check if this could work:
    
    // let queryStatment = `SELECT * FROM tltransaction t WHERE t.user_id = ${userId} GROUP BY t.account_id`;

    // TLTransaction.sendNativeQuery(queryStatment, function(err, rawResult) {
    //   if (err) { 
    //     return res.serverError(err); 
    //   }
    
    //   return res.ok(rawResult);
    // });
  }
};

