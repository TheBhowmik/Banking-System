const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router(); //what is router? - it is a mini express application that can be used to define routes and middleware for a specific part of the application, in this case, for account-related routes. It allows us to modularize our route definitions and keep our code organized.

/*
  route - POST /api/accounts
  create a new account for the authenticated user
  protected route - requires authentication
*/

router.post("/",authMiddleware.authMiddleware, accountController.createAccountController);


module.exports = router;