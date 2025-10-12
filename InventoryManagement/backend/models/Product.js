import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    actualPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reorderLevel: { type: Number, required: true },
    supplier: { type: String, required: true },
    expirationDate: { type: Date },
    notify: { type: Number },
    lastNotificationSent: { type: Date },
    dateAdded: { type: Date, default: Date.now },
    dateUpdated: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

productSchema.pre('save', function(next) {
    this.dateUpdated = Date.now();
    next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;