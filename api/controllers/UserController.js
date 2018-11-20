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
    const code = req.query.code;
    const tokens = await client.exchangeCodeForToken(redirect_uri, code);
    
    // save user
    const user = await User.create(tokens).fetch();

    // get accounts
    let accounts = (await DataAPIClient.getAccounts(tokens.access_token)).results;
    
    for (let index = 0; index < accounts.length; index++) {
      let account = accounts[index];

      let provider = await TLProvider.create(account.provider).fetch();
      let accountNumber = await TLAccountNumber.create(account.account_number).fetch();

      account.provider = provider.id;
      account.account_number = accountNumber.id;
      account.user = user.id;

      let tlAccount = await TLAccount.create(account).fetch();
      
      let transactionsForAccount = (await DataAPIClient.getTransactions(tokens.access_token, account.account_id)).results;
      
      for ( let tr_index = 0 ; tr_index < transactionsForAccount.length ; tr_index ++){
        let transaction = transactionsForAccount[tr_index];

        transaction['account'] = tlAccount.id;
        // if(!transaction.merchant_name) {
        //   console.log(transaction)
        // }

        if (transaction.meta) {
          let meta = await TLTransactionMeta.create(transaction.meta).fetch();
          transaction.meta = meta.id;
        }

        transaction.transaction_classification = transaction.transaction_classification.join(' ');

        let tl_transaction = await TLTransaction.create(transaction).fetch();
      }

    }

    // return transaction
    res.ok();
  },
  getTransactions: async function(req, res) {
    let userId = req.params.userId;
    let transactions = {};

    const accounts = await TLAccount.find({user: userId});

    for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
      const account = accounts[accountIndex];
      const transactionsPerAccount = await TLTransaction.find({'account': account.id});
      transactions[account.id] = transactionsPerAccount;
      // console.log(transactionsPerAccount.length);
    }
    // console.log('-----')
    res.ok(transactions.length);
  }
};

