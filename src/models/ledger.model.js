const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account is required'],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction is required'],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['debit', 'credit'],
            message: 'Type must be either debit or credit'
        },
        required: [true, 'Ledger type is required'],
        immutable: true
        }
});

function preventLedgerModification() {
    throw new Error('Ledger entries cannot be modified or deleted');
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('findByIdAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);


const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;