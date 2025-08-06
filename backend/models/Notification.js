import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['expiry', 'reorder'], default: 'expiry' },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 