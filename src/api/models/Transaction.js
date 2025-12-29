const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  amount: { type: Number, required: true },
  orderInfo: { type: String, required: true }, 
  sepayTransactionId: { type: String, unique: true }, 
  status: { type: String, enum: ["success", "pending", "failed"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema);