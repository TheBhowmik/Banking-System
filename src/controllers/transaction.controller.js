const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    const {fromAccount,toAccount,amount,idempotencyKey} = req.body

    // Step 1: Validate request

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({message: 'Missing required fields'})
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({message: 'One or both accounts not found'})
    }

    // Step 2: Validate idempotency key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionAlreadyExists){

        if(isTransactionAlreadyExists.status === 'completed'){
            return res.status(200).json({message: 'Transaction already completed', transaction: isTransactionAlreadyExists}) //what is inside the isTransactionAlreadyExists.transaction is the transaction document that was created with the same idempotency key. This allows the client to receive the details of the already completed transaction without creating a duplicate transaction.
        }
        if(isTransactionAlreadyExists.status === 'pending'){
            return res.status(202).json({message: 'Transaction is still pending'})
        }
        if(isTransactionAlreadyExists.status === 'failed'){
            return res.status(500).json({message: 'Previous transaction attempt failed. Please try again.'})
        }
        if(isTransactionAlreadyExists.status === 'reversed'){
            return res.status(500).json({message: 'Previous transaction attempt was reversed. Please try again.'})
        }
    }

    // Step 3: Check account status

    if(fromUserAccount.status !== 'active' || toUserAccount.status !== 'active'){
        return res.status(400).json({message: 'Both accounts must be active to perform a transaction'})
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    //create a session for transaction

    const session = await mongoose.startSession() //startSession is a method provided by the mongoose library that allows us to create a new session for performing operations on the database. A session is a context in which we can execute multiple operations as a single unit of work. It provides features like transactions, which allow us to ensure data integrity and consistency when performing multiple related operations.
    session.startTransaction()
    //startTransaction is given by the mongoose library and it is used to start a transaction session. It allows us to execute multiple operations as a single unit of work. If any operation within the transaction fails, we can roll back all changes made during the transaction to maintain data integrity.

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: 'pending'
    }, {session})

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        transaction: transaction._id,
        type: 'debit',
        amount: amount
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        transaction: transaction._id,
        type: 'credit',
        amount: amount
    }], {session})

    transaction.status = 'completed'
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    // Send email notification to both parties

     await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })


}

async function createInitialFundsTransaction(req, res) {

    const  {toAccount, amount, idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({message: 'Missing required fields'})
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!toUserAccount){
        return res.status(404).json({message: 'Account not found'})
    }

    const fromUserAccount = await accountModel.findOne({
        systemAccount : true,
        user : req.user._id //since only system users can create initial funds transactions, we can use the user id from the request to find the system account associated with that user. This ensures that the initial funds transaction is properly attributed to the correct system account, allowing for accurate tracking and auditing of transactions within the banking system.
    })

    if(!fromUserAccount){
        return res.status(404).json({message: 'System account not found for the user'})
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: 'pending'
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        transaction: transaction._id,
        type: 'debit',
        amount: amount
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        transaction: transaction._id,
        type: 'credit',
        amount: amount
    }], {session})

    transaction.status = 'completed'
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}