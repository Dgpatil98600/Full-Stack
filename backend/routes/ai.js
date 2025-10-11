import express from 'express';
import Product from '../models/Product.js';
import Bill from '../models/Bill.js';
import { getProductAnalysisData } from './productAnalysis.js';

const router = express.Router();

router.get('/context', async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all products, limiting fields for conciseness and performance
        const products = await Product.find({ user: userId })
            .select('name displayName category sellingPrice quantity reorderLevel')
            .lean();

        // Fetch bills from the last 30 days
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
 
        const topProductbyMonth = await getProductAnalysisData(userId, { range: '1m' });
        const overALLtopProducts = await getProductAnalysisData(userId, { range: 'all' });
        
        const bills = await Bill.find({ user: userId, date: { $gte: oneMonthAgo } })
            .select('items.productName items.quantity items.total grandTotal date')
            .limit(50) // Limit to the 50 most recent bills to avoid an overly large prompt
            .sort({ date: -1 })
            .lean();

        res.status(200).json({ products, bills, topProductbyMonth, overALLtopProducts });
    } catch (error) {
        console.error('Error fetching AI context:', error);
        res.status(500).json({ error: 'Failed to fetch data for AI assistant.' });
    }
});

export default router;
