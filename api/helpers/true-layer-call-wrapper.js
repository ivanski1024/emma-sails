module.exports = {
  friendlyName: 'True layer call wrapper',
  description: '',
  inputs: {
    methodToCall: {
      type: 'ref',
      description: 'The TrueLayer API client method is to be called',
      required: true
    },
    params: {
      type: 'ref',
      description: 'The parameters for the TrueLayer API call',
      required: true
    }

  },
  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: async function (inputs) {
    let result = null;
    let timing = null;
    let start = null;
    let response = null;
  
    start = Date.now(); 
  
    let methodToCall = inputs.methodToCall;
    let params = inputs.params;

    try {
      response = params.account_id ? 
        await methodToCall(params.access_token, params.account_id) :
        await methodToCall(params.access_token);
    } catch (err) {
      timing = Date.now() - start; 
  
      result = {
        status: 'fail',
        error: err.error,
        message: err.message,
        method: methodToCall.name,
        timing: timing
      }
    
      throw result;
    }
  
    timing = Date.now() - start;
  
    result = {
      status: 'success',
      ...response,
      timing: timing
    }
  
    return result;
  }
};

