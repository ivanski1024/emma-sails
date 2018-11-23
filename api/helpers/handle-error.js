module.exports = {
  friendlyName: "Handle error",
  description: "Handles error from TrueLayer API",
  inputs: {
    error: {
      type: "ref",
      required: true
    }
  },
  exits: {
    success: {
      description: "Parsed error object for Front-End or other system."
    }
  },
  fn: async function(inputs) {
    let err = inputs.error;
    return { staus: "fail", error: err.error, message: err.message };
  }
};
