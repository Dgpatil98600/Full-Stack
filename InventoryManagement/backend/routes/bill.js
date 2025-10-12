import express from 'express';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const { filter } = req.query;
        const userId = req.user.id;

        console.log('Fetching bills for user:', userId, 'with filter:', filter);
        const billCount = await Bill.countDocuments({ user: userId });
        console.log('Total bills for user:', billCount);

        let dateFilter = {};
        const now = new Date();
        
        switch (filter) {
            case 'today':
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);
                dateFilter = {
                    date: {
                        $gte: todayStart,
                        $lte: todayEnd
                    }
                };
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                dateFilter = {
                    date: {
                        $gte: weekStart,
                        $lte: now
                    }
                };
                break;
            case 'month':
                const monthStart = new Date(now);
                monthStart.setMonth(now.getMonth() - 1);
                dateFilter = {
                    date: {
                        $gte: monthStart,
                        $lte: now
                    }
                };
                break;
            case 'year':
                const yearStart = new Date(now);
                yearStart.setFullYear(now.getFullYear() - 1);
                dateFilter = {
                    date: {
                        $gte: yearStart,
                        $lte: now
                    }
                };
                break;
            default:
                dateFilter = {};
        }

        console.log('Date filter:', dateFilter);

        const bills = await Bill.find({
            user: userId,
            ...dateFilter
        }).sort({ date: -1 });

        console.log('Found bills:', bills.length);
        console.log('Sample bill:', bills.length > 0 ? bills[0] : 'No bills found');

        res.status(200).json(bills);
    } catch (error) {
        console.error('Error in /list route:', error);
        res.status(500).json({ 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
});

router.post('/create', async (req, res) => {
    try {
        const { customerName, items } = req.body;
        const userId = req.user.id;

        const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
        const netQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const bill = new Bill({
            customerName,
            billNumber,
            items,
            grandTotal,
            netQuantity,
            user: userId
        });

        await bill.save();

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();

                if (product.quantity <= product.reorderLevel) {
                    try {
                        const response = await fetch('http://localhost:5000/api/notifications/reorder-notify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
                            },
                            body: JSON.stringify({
                                productId: product._id,
                                quantity: product.quantity,
                                reorderLevel: product.reorderLevel,
                                forceCheck: true 
                            })
                        });

                        if (!response.ok) {
                            console.error('Failed to send reorder notification for product:', product.name);
                        }
                    } catch (error) {
                        console.error('Error sending reorder notification:', error);
                    }
                }
            }
        }

        const allProducts = await Product.find({
            reorderLevel: { $exists: true, $ne: null }
        });

        for (const product of allProducts) {
            if (product.quantity <= product.reorderLevel) {
                try {
                    const response = await fetch('http://localhost:5000/api/notifications/reorder-notify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
                        },
                        body: JSON.stringify({
                            productId: product._id,
                            quantity: product.quantity,
                            reorderLevel: product.reorderLevel,
                            forceCheck: true 
                        })
                    });

                    if (!response.ok) {
                        console.error('Failed to send reorder notification for product:', product.name);
                    }
                } catch (error) {
                    console.error('Error sending reorder notification:', error);
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            bill
        });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create bill'
        });
    }
});

export default router;