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

    

}