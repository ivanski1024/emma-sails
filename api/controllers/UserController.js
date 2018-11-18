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
  register: function(req, res){
    const nonce = crypto.randomBytes(12);
    const authURL = client.getAuthUrl(redirect_uri, scopes, nonce, null, null, true);
    res.redirect(authURL);
  },
  callback: async function(req,res){
    const code = req.query.code;
    const tokens = await client.exchangeCodeForToken(redirect_uri, code);
    const info = await DataAPIClient.getInfo(tokens.access_token);

    res.set("Content-Type", "text/plain");
    res.send(`Access Token: ${JSON.stringify(info, null, 2)}`);
  }
};

