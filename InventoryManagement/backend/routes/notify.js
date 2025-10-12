import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import twilio from 'twilio';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
console.log('Notification route - Environment variables:', {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Configured' : 'Missing',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? 'Configured' : 'Missing'
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, error: 'Invalid token' });
    req.user = decoded; 
    next();
  });
};

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
    {
        accountSid: process.env.TWILIO_ACCOUNT_SID
    }
);

const getDaysBetween = (date1, date2) => {
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getNotificationInterval = (daysLeft) => {
    if (daysLeft >= 30) return 72; 
    if (daysLeft >= 10) return 48; 
    if (daysLeft >= 5) return 24;  
    if (daysLeft >= 2) return 5;   
    if (daysLeft === 1) return 1;  
    return 1;
};

const hasExpired = (expirationDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expDate = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
    return today > expDate;
};

const shouldSendNotification = (product, daysLeft, interval) => {
    if (!interval) return true;
    
    const now = new Date();
    const hoursSinceLastNotification = product.lastNotificationSent 
        ? (now - product.lastNotificationSent) / (1000 * 60 * 60)
        : Infinity;
    
    console.log(`Notification check for ${product.name}:`, {
        daysLeft,
        interval,
        hoursSinceLastNotification,
        shouldSend: hoursSinceLastNotification >= interval
    });
    
    return hoursSinceLastNotification >= interval;
};

const lastReorderNotificationTimes = new Map();

const shouldSendReorderNotification = (productId, forceCheck = false) => {
    const lastNotificationTime = lastReorderNotificationTimes.get(productId);
    const now = Date.now();
    
    if (!lastNotificationTime) {
        return true;
    }

    if (forceCheck) {
        return true;
    }

    const hoursSinceLastNotification = (now - lastNotificationTime) / (1000 * 60 * 60);
    return hoursSinceLastNotification >= 1;
};

router.get('/notify', authenticate, async (req, res) => {
    try {
        console.log('Starting notification check...');
        const products = await Product.find({
            expirationDate: { $ne: null },
            notify: { $exists: true, $ne: null }
        }).populate('user');

        console.log(`Found ${products.length} products to check for notifications`);

        const now = new Date();
        let notificationsSent = 0;
        
        for (const product of products) {
            const daysLeft = getDaysBetween(now, product.expirationDate);
            

            if (!product || !product.user) {
                console.log('Skipping product - not found or no user:', product?._id);
                continue;
            }

            console.log(`Processing product: ${product.name}, User contact: ${product.user.contact}, Days left: ${daysLeft}, Notify threshold: ${product.notify}`);
            if (daysLeft <= product.notify) {
                const interval = getNotificationInterval(daysLeft);
                console.log(`Notification interval for ${product.name}: ${interval} hours`);
                
                if (shouldSendNotification(product, daysLeft, interval)) {
                    const message = `Product "${product.name}" will expire in ${daysLeft + 1} days.`;
                    
                    try {
                        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
                            throw new Error('Twilio configuration is incomplete');
                        }

                        console.log(`Attempting to send SMS to ${product.user.contact}`, {
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: product.user.contact,
                            message: message,
                            accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing'
                        });

                        const smsResult = await twilioClient.messages.create({
                            body: message,
                            to: product.user.contact,
                            from: process.env.TWILIO_PHONE_NUMBER
                        });

                        console.log(`SMS sent successfully. SID: ${smsResult.sid}`);

                        const newNotification = new Notification({
                            userId: product.user._id,
                            productId: product._id,
                            productName: product.name,
                            message: message,
                            timestamp: now
                        });
                        await newNotification.save();
                        console.log('Notification saved to database');

                        product.lastNotificationSent = now;
                        await product.save();
                        
                        notificationsSent++;

                    } catch (twilioError) {
                        console.error('Error sending SMS:', {
                            error: twilioError.message,
                            code: twilioError.code,
                            moreInfo: twilioError.moreInfo,
                            status: twilioError.status,
                            contact: product.user.contact,
                            twilioConfig: {
                                accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing',
                                authToken: process.env.TWILIO_AUTH_TOKEN ? 'Configured' : 'Missing',
                                phoneNumber: process.env.TWILIO_PHONE_NUMBER ? 'Configured' : 'Missing'
                            }
                        });
                    }
                } else {
                    console.log(`Skipping notification for ${product.name} - interval not met`);
                }
            } else {
                console.log(`Skipping notification for ${product.name} - days left (${daysLeft}) > notify threshold (${product.notify})`);
            }

            if (hasExpired(product.expirationDate)) {
                const existingExpirationNotification = await Notification.findOne({
                    productId: product._id,
                    message: { $regex: /has expired/ }
                });

                if (existingExpirationNotification) {
                    console.log(`Skipping expiration notification for ${product.name} - already sent previously`);
                    continue;
                }

                const message = `Product "${product.name}" has expired.`;
                try {
                    console.log(`Attempting to send expiration SMS to ${product.user.contact}`);
                    const smsResult = await twilioClient.messages.create({
                        body: message,
                        to: product.user.contact,
                        from: process.env.TWILIO_PHONE_NUMBER
                    });
                    console.log(`Expiration SMS sent successfully. SID: ${smsResult.sid}`);

                    const finalNotification = new Notification({
                        userId: product.user._id,
                        productId: product._id,
                        productName: product.name,
                        message: message,
                        timestamp: now
                    });
                    await finalNotification.save();
                    console.log('Expiration notification saved to database');

                    product.lastNotificationSent = now;
                    await product.save();
                    
                    notificationsSent++;

                } catch (twilioError) {
                    console.error('Error sending expiration SMS:', {
                        error: twilioError.message,
                        code: twilioError.code,
                        contact: product.user.contact
                    });
                    try {
                        const finalNotification = new Notification({
                            userId: product.user._id,
                            productId: product._id,
                            productName: product.name,
                            message: message,
                            timestamp: now
                        });
                        await finalNotification.save();
                        console.log('Expiration notification saved to database (SMS failed)');
                        
                        product.lastNotificationSent = now;
                        await product.save();
                        
                        notificationsSent++;
                    } catch (dbError) {
                        console.error('Error saving expiration notification to database:', dbError);
                    }
                }
            }
        }

        console.log(`Notification check completed. Sent ${notificationsSent} notifications.`);
        res.status(200).json({ 
            message: 'Notification check completed',
            notificationsSent
        });
    } catch (error) {
        console.error('Notification processing error:', error);
        res.status(500).json({ error: 'Failed to process notifications' });
    }
});

const cleanupNotifications = async (userId) => {
    try {
        const notifications = await Notification.find({ userId });
        const existingProducts = await Product.find({ user: userId }).select('_id');
        const existingProductIds = new Set(existingProducts.map(p => p._id.toString()));
        const notificationsToDelete = notifications.filter(notif => 
            notif.productId && !existingProductIds.has(notif.productId.toString())
        );
 
        if (notificationsToDelete.length > 0) {
            await Notification.deleteMany({
                _id: { $in: notificationsToDelete.map(n => n._id) }
            });
            console.log(`Cleaned up ${notificationsToDelete.length} notifications for non-existent products`);
        }
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
    }
};

router.get('/list', authenticate, async (req, res) => {
    try {
        await cleanupNotifications(req.user.id);
        
        const notifications = await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Notification.deleteOne({ _id: id, userId: req.user.id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Notification not found or not authorized' });
        }

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

router.delete('/delete-by-product/:productId', authenticate, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await Notification.deleteMany({ 
            productId,
            userId: req.user.id 
        });
        
        console.log(`Deleted ${result.deletedCount} notifications for product ${productId}`);
        res.status(200).json({ 
            message: 'Notifications deleted successfully',
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        res.status(500).json({ error: 'Failed to delete notifications' });
    }
});

router.get('/reorder-check', authenticate, async (req, res) => {
    try {
        console.log('Starting scheduled reorder notification check...');
        const products = await Product.find({
            reorderLevel: { $exists: true, $ne: null }
        }).populate('user');

        console.log(`Found ${products.length} products to check for reorder notifications`);

        const now = new Date();
        let notificationsSent = 0;
        
        for (const product of products) {
            if (!product || !product.user) {
                console.log('Skipping product - not found or no user:', product?._id);
                continue;
            }

            console.log(`Processing product: ${product.name}, Current quantity: ${product.quantity}, Reorder level: ${product.reorderLevel}`);

            if (product.quantity <= product.reorderLevel) {
                if (!shouldSendReorderNotification(product._id.toString())) {
                    console.log(`Skipping notification for ${product.name} - interval not met`);
                    continue;
                }

                if(product.quantity == 0) {
                    const message = `Dear "${product.user.username}" your product "${product.name}" is out of stock reorder quickly`;
                    try {
                        const smsResult = await twilioClient.messages.create({
                            body: message,
                            to: product.user.contact,
                            from: process.env.TWILIO_PHONE_NUMBER
                        });

                        console.log(`Reorder SMS sent successfully. SID: ${smsResult.sid}`);

                        const newNotification = new Notification({
                            userId: product.user._id,
                            productId: product._id,
                            productName: product.name,
                            message: message,
                            type: 'reorder',
                            timestamp: now
                        });
                        await newNotification.save();
                        console.log('Reorder notification saved to database');
     
                        lastReorderNotificationTimes.set(product._id.toString(), now.getTime());
                        notificationsSent++;
                    } catch (twilioError) {
                        console.error('Error sending reorder SMS:', twilioError);
   
                        try {
                            const newNotification = new Notification({
                                userId: product.user._id,
                                productId: product._id,
                                productName: product.name,
                                message: message,
                                type: 'reorder',
                                timestamp: now
                            });
                            await newNotification.save();
                            console.log('Reorder notification saved to database (SMS failed)');
     
                            lastReorderNotificationTimes.set(product._id.toString(), now.getTime());
                            notificationsSent++;
                        } catch (dbError) {
                            console.error('Error saving reorder notification to database:', dbError);
                        }
                    }
                } else {
                    const message = `Dear "${product.user.username}" the product quantity of "${product.name}" is running low. Please restock soon. Current quantity: ${product.quantity}, Reorder level: ${product.reorderLevel}`;
                    try {
                        const smsResult = await twilioClient.messages.create({
                            body: message,
                            to: product.user.contact,
                            from: process.env.TWILIO_PHONE_NUMBER
                        });

                        console.log(`Reorder SMS sent successfully. SID: ${smsResult.sid}`);

                        const newNotification = new Notification({
                            userId: product.user._id,
                            productId: product._id,
                            productName: product.name,
                            message: message,
                            type: 'reorder',
                            timestamp: now
                        });
                        await newNotification.save();
                        console.log('Reorder notification saved to database');
       
                        lastReorderNotificationTimes.set(product._id.toString(), now.getTime());
                        notificationsSent++;
                    } catch (twilioError) {
                        console.error('Error sending reorder SMS:', twilioError);
                        try {
                            const newNotification = new Notification({
                                userId: product.user._id,
                                productId: product._id,
                                productName: product.name,
                                message: message,
                                type: 'reorder',
                                timestamp: now
                            });
                            await newNotification.save();
                            console.log('Reorder notification saved to database (SMS failed)');

                            lastReorderNotificationTimes.set(product._id.toString(), now.getTime());
                            notificationsSent++;
                        } catch (dbError) {
                            console.error('Error saving reorder notification to database:', dbError);
                        }
                    }
                }
            } else {
                console.log(`Skipping reorder notification for ${product.name} - quantity (${product.quantity}) > reorder level (${product.reorderLevel})`);
            }
        }

        console.log(`Reorder notification check completed. Sent ${notificationsSent} notifications.`);
        res.status(200).json({ 
            message: 'Reorder notification check completed',
            notificationsSent
        });
    } catch (error) {
        console.error('Reorder notification processing error:', error);
        res.status(500).json({ error: 'Failed to process reorder notifications' });
    }
});

router.post('/reorder-notify', authenticate, async(req, res) => {
    try {
        const { productId, quantity, reorderLevel, forceCheck = false } = req.body;
        const product = await Product.findById(productId).populate('user');
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (quantity <= reorderLevel) {
            if (!forceCheck && !shouldSendReorderNotification(product._id.toString())) {
                console.log(`Skipping notification for ${product.name} - interval not met`);
                return res.status(200).json({ message: 'Notification skipped - interval not met' });
            }

            if(product.quantity == 0) {
                const message = `Dear "${product.user.username}" your product "${product.name}" is out of stock reorder quickly`;
                try {
                    const smsResult = await twilioClient.messages.create({
                        body: message,
                        to: product.user.contact,
                        from: process.env.TWILIO_PHONE_NUMBER
                    });

                    console.log(`Reorder SMS sent successfully. SID: ${smsResult.sid}`);

                    const newNotification = new Notification({
                        userId: product.user._id,
                        productId: product._id,
                        productName: product.name,
                        message: message,
                        type: 'reorder',
                        timestamp: new Date()
                    });
                    await newNotification.save();

                    lastReorderNotificationTimes.set(product._id.toString(), Date.now());
                    
                    res.status(200).json({ 
                        message: 'Reorder notification sent successfully',
                        notification: newNotification
                    });
                } catch (twilioError) {
                    console.error('Error sending reorder SMS:', twilioError);
                    const newNotification = new Notification({
                        userId: product.user._id,
                        productId: product._id,
                        productName: product.name,
                        message: message,
                        type: 'reorder',
                        timestamp: new Date()
                    });
                    await newNotification.save();
                    lastReorderNotificationTimes.set(product._id.toString(), Date.now());
                    
                    res.status(200).json({ 
                        message: 'Reorder notification saved (SMS failed)',
                        notification: newNotification
                    });
                }
            } else {
                const message = `Dear "${product.user.username}" the product quantity of "${product.name}" is running low. Please restock soon. Current quantity: ${product.quantity}, Reorder level: ${product.reorderLevel}`;
                try {
                    const smsResult = await twilioClient.messages.create({
                        body: message,
                        to: product.user.contact,
                        from: process.env.TWILIO_PHONE_NUMBER
                    });

                    console.log(`Reorder SMS sent successfully. SID: ${smsResult.sid}`);

                    const newNotification = new Notification({
                        userId: product.user._id,
                        productId: product._id,
                        productName: product.name,
                        message: message,
                        type: 'reorder',
                        timestamp: new Date()
                    });
                    await newNotification.save();
         
                    lastReorderNotificationTimes.set(product._id.toString(), Date.now());
                    
                    res.status(200).json({ 
                        message: 'Reorder notification sent successfully',
                        notification: newNotification
                    });
                } catch (twilioError) {
                    console.error('Error sending reorder SMS:', twilioError);
                    const newNotification = new Notification({
                        userId: product.user._id,
                        productId: product._id,
                        productName: product.name,
                        message: message,
                        type: 'reorder',
                        timestamp: new Date()
                    });
                    await newNotification.save();
                    lastReorderNotificationTimes.set(product._id.toString(), Date.now());
                    
                    res.status(200).json({ 
                        message: 'Reorder notification saved (SMS failed)',
                        notification: newNotification
                    });
                }
            }
        } else {
            res.status(200).json({ message: 'Quantity above reorder level, no notification needed' });
        }
    } catch (error) {
        console.error('Error processing reorder notification:', error);
        res.status(500).json({ error: 'Failed to process reorder notification' });
    }
});

export default router; 