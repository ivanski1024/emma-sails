const validator = require("validator");

module.exports = {
  friendlyName: "Get user",

  description: "Gets and returns a user from the DB",

  inputs: {
    userId: {
      type: "string",
      example: "123e4567-e89b-12d3-a456-426655440000",
      description: "The id of the user.",
      required: true
    }
  },

  exits: {
    success: {
      outputFriendlyName: "User"
    }
  },

  fn: async function(params) {
    if (!validator.isUUID(params.userId)) {
      throw new Error("invalid user id");
    }

    let user = await User.find({ userId: params.userId });

    if (!user && !user.length != 1) {
      throw new Error("no such user");
    }

    return user[0];
  }
};
