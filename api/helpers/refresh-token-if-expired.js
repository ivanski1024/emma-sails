const { DataAPIClient } = require("truelayer-client");

module.exports = {
  friendlyName: "Refresh token if expired",
  description: "",
  inputs: {
    user: {
      type: "ref",
      description: "The user for which the token is refreshed.",
      required: true
    },
    client: {
      type: "ref",
      description: "TrueLayers AuthAPIClient to use.",
      required: true
    }
  },
  exits: {
    success: {
      description: "All done."
    }
  },

  fn: async function(inputs) {
    let client = inputs.client;
    let user = inputs.user;

    // check if accessToken is still valid
    let isTokenValid = await DataAPIClient.validateToken(user.accessToken);

    // if not refresh it and update db
    if (!isTokenValid) {
      // refresh tokens
      let newTokens = null;
      try {
        let result = await client.refreshAccessToken(user.refreshToken).results;
        newTokens = {
          accessToken: result.access_token,
          refreshToken: result.refresh_token
        };
      } catch (err) {
        return sails.helpers.handleError(err);
      }

      let userId = inputs.user.userId;
      let updatedUser = await User.update({ userId })
        .set(newTokens)
        .fetch();

      return updatedUser;
    }

    return user;
  }
};
