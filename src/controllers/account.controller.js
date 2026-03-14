const accountModel = require("../models/account.model");

async function createAccountController(req, res) {

    const user = req.user; 

    const account = await accountModel.create({
        user : user._id // Associate the account with the authenticated user's ID - This means that when creating a new account, we are linking it to the currently authenticated user by using their unique identifier (user._id) from the database. This allows us to keep track of which accounts belong to which users and ensures that only the owner of the account can access or manage it in the future.
    });

    res.status(201).json({
        message : "Account created successfully.",
        account // Return the created account details in the response. what is in the account variable? - it contains the newly created account document that was saved to the database, including its ID, user association, status, currency, and timestamps.
    });
}

module.exports = {
    createAccountController
};


