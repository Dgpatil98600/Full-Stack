// models/Bill.js
import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    billNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        displayName: { type: String, required: true },
        quantity: { type: Number, required: true },
        category: { type: String, required: true },
        total: { type: Number, required: true },
        actualPrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true }
    }],
    grandTotal: { type: Number, required: true },
    netQuantity: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;