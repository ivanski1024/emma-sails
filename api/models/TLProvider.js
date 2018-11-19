/**
 * TLProvider.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  
  attributes: {
    display_name: { type: 'string', required: true },
    provider_id: { type: 'string', required: true },
    logo_uri: { type: 'string', required: true } 
  }

};

