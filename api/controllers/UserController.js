/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const { AuthAPIClient, DataAPIClient } = require("truelayer-client");
const crypto = require("crypto");
const uuidv4 = require("uuid/v4");

const handleError = sails.helpers.handleError;

const redirect_uri = sails.config.custom.baseUrl + "callback";

// Create TrueLayer client instance
const client = new AuthAPIClient({
  client_id: sails.config.client_id,
  client_secret: sails.config.client_secret
});

module.exports = {
  root: function(req, res) {
    const nonce = crypto.randomBytes(12);
    const authURL = client.getAuthUrl(
      redirect_uri,
      sails.config.custom.trueLayer.scopes,
      nonce,
      null,
      null,
      sails.config.custom.trueLayer.enableMock
    );
    res.redirect(authURL);
  },

  callback: async function(req, res) {
    // get tokens
    let tokens = null;
    try {
      let result = await client.exchangeCodeForToken(
        redirect_uri,
        req.query.code
      );
      tokens = {
        accessToken: result.access_token,
        refreshToken: result.refresh_token
      };
    } catch (err) {
      return res.serverError(handleError(err));
    }

    // generate unique user id
    const userId = uuidv4();

    // create user
    await User.create({ ...tokens, userId });

    // retrieve user information from TrueLayer
    let fullUserInformation = null;

    try {
      fullUserInformation = await sails.helpers.getUserInfo(tokens.accessToken);
    } catch (err) {
      return res.serverError(handleError(err));
    }

    try {
      await sails.helpers.storeUserInformation(userId, fullUserInformation);
    } catch (err) {
      return res.serverError(handleError(err));
    }

    res.ok({ status: "Success", code: 200, result: { userId } });
  },
  getTransactions: async function(req, res) {
    let userId = req.query.userId;

    const transactions = await TLTransaction.find({ userId: userId });
    let result = {};

    await transactions.map(transaction => {
      let accountId = transaction.accountId;
      if (!result[accountId]) {
        result[accountId] = [];
      }

      result[accountId].push(transaction);
    });

    return res.ok(result);
  },
  getDebugInformation: async function(req, res) {
    let user = await sails.helpers.getUser(req.query.userId);

    try {
      user = await sails.helpers.refreshTokenIfExpired(user, client);
    } catch (err) {
      return res.serverError({
        status: "Failed",
        code: 500,
        error: "token_refresh_error",
        message: "Error from token refreshing",
        internalError: err
      });
    }

    let info = await sails.helpers.getUserInfo(user.accessToken);
    return res.ok(info);
  }
};
