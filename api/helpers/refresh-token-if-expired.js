const {DataAPIClient} = require("truelayer-client");

module.exports = {
  friendlyName: 'Refresh token if expired',
  description: '',
  inputs: {
    user: {
      type: 'ref',
      description: 'The user for which the token is refreshed.',
      required: true
    },
    client: {
      type: 'ref',
      description: 'TrueLayer\s AuthAPIClient to use.',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: async function (inputs) {
    let user = inputs.user;
    let client = inputs.client;
    let isTokenValid = await DataAPIClient.validateToken(user.access_token);
    
    if(!isTokenValid) {
      let newTokens = await client.refreshAccessToken(user.refresh_token);
  
      let updatedUser = await User.update({user_id: user.user_id}).set({access_token: newTokens.results.access_token, refresh_token: newTokens.results.refresh_token}).fetch();
  
      return updatedUser;
    }
  
    return user;
  }
};

