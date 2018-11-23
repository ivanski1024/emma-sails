const parseTransaction = function(transaction, additionalFields) {
  return {
    ...additionalFields,
    transactionId: transaction.transaction_id,
    amount: transaction.amount,
    currency: transaction.currency,
    transactionType: transaction.transaction_type,
    transactionCategory: transaction.transaction_category,
    timestamp: transaction.timestamp,
    merchantName: transaction.merchant_name ? transaction.merchant_name : "",
    description: transaction.description ? transaction.description : "",
    transactionClassification: transaction.transaction_classification
      ? transaction.transaction_classification.join(" ")
      : ""
  };
};

module.exports = {
  friendlyName: "Store user information",
  description: "",
  inputs: {
    userId: {
      type: "string",
      description: "The id of the user in the db",
      required: true
    },
    fullUserInformation: {
      type: "ref",
      description: "Fetched Information from TrueLayer for user.",
      required: true
    }
  },
  exits: {
    success: {
      description: "All done."
    }
  },
  fn: async function(inputs) {
    let userId = inputs.userId;
    let fullUserInformation = inputs.fullUserInformation;

    // TODO: better error handling

    // update user
    let fullName = fullUserInformation.personalInfo.results[0].full_name;
    let email = fullUserInformation.personalInfo.results[0].emails[0];
    await User.update({ userId })
      .set({ fullName, email })
      .fetch();

    // for each account
    await Promise.all(
      fullUserInformation.accounts.results.map(async account => {
        let accountId = account.account_id;

        // Parse transactions
        let transactions = await Promise.all(
          fullUserInformation.transactionsPerAccount[accountId].results.map(
            async transaction => {
              return parseTransaction(transaction, {
                userId,
                accountId,
                parrentType: "bankAccount"
              });
            }
          )
        );

        // bulk save transactions per account
        await TLTransaction.createEach(transactions);
      })
    );

    // for each card
    await Promise.all(
      fullUserInformation.cards.results.map(async card => {
        let accountId = card.account_id;

        // Parse transactions
        let transactions = await Promise.all(
          fullUserInformation.transactionsPerCard[card.account_id].results.map(
            transaction => {
              return parseTransaction(transaction, {
                userId,
                accountId,
                parentType: "card"
              });
            }
          )
        );

        // bulk save transactions per account
        await TLTransaction.createEach(transactions);
      })
    );
  }
};
