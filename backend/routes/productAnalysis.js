// routes/productAnalysis.js
import express from 'express';
import Bill from '../models/Bill.js';

const router = express.Router();

function getDateFromRange(range) {
    const now = new Date();
    switch (range) {
        case '1m': return new Date(now.setMonth(now.getMonth() - 1));
        case '3m': return new Date(now.setMonth(now.getMonth() - 3));
        case '6m': return new Date(now.setMonth(now.getMonth() - 6));
        case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case '3y': return new Date(now.setFullYear(now.getFullYear() - 3));
        case '4y': return new Date(now.setFullYear(now.getFullYear() - 4));
        case '5y': return new Date(now.setFullYear(now.getFullYear() - 5));
        case 'all': default: return new Date('1950-01-01');
    }
}

// 🔹 reusable function
export async function getProductAnalysisData(userId, { fromDate, toDate, range = '1m', category }) {
    // Build date filter
    let dateFilter;
    if (fromDate && toDate) {
        dateFilter = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    } else {
        const from = getDateFromRange(range);
        dateFilter = { $gte: from };
    }

    // Fetch bills in range for the user
    const bills = await Bill.find({ user: userId, date: dateFilter });
    if (!bills || bills.length === 0) {
        return { totalProfit: 0, topProducts: [] };
    }

    const groupMap = {}; // keyed by normalized displayName (lowercase)
    let totalProfit = 0;

    // Use nested for..of loops only (no forEach)
    for (const bill of bills) {
        const items = bill.items || [];
        for (const item of items) {
            if (category && category !== 'all' && item.category !== category) {
                continue;
            }

            const rawDisplayName = item.displayName;
            const normalized = (rawDisplayName || '').toString().trim().toLowerCase();

            const quantity = Number(item.quantity);
            const actualPrice = Number(item.actualPrice);
            const sellingPrice = Number(item.sellingPrice);

            if (!groupMap[normalized]) {
                groupMap[normalized] = {
                    displayName: rawDisplayName,
                    totalProfit: 0,
                    productCount: 0,
                    category: item.category ?? null
                };
            }

            if (!Number.isNaN(quantity) && !Number.isNaN(actualPrice) && !Number.isNaN(sellingPrice) && quantity > 0) {
                const profit = (sellingPrice - actualPrice) * quantity;
                totalProfit += profit;
                groupMap[normalized].totalProfit += profit;
                groupMap[normalized].productCount += quantity;

                if (!groupMap[normalized].category && item.category) {
                    groupMap[normalized].category = item.category;
                }
            }
        }
    }

    let topProducts = Object.values(groupMap).map(g => ({
        displayName: g.displayName,
        totalProfit: typeof g.totalProfit === 'number' ? g.totalProfit : 0,
        productCount: typeof g.productCount === 'number' ? g.productCount : 0,
        category: g.category
    }));

    if (category && category !== 'all') {
        topProducts = topProducts.filter(p => p.category === category);
    }

    topProducts.sort((a, b) => b.totalProfit - a.totalProfit);

    return { totalProfit, topProducts };
}

// Return distinct categories from bill items. Frontend should add "All Categories" option client-side.
router.get('/categories', async (req, res) => {
    try {
        const userId = req.user.id;
        const categories = await Bill.distinct('items.category', { user: userId });
        const filtered = categories.filter(c => c).sort();
        res.json(filtered);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route using the reusable function
router.get('/', async (req, res) => {
    console.log('Product analysis route HIT');
    try {
        const userId = req.user.id;
        const responseBody = await getProductAnalysisData(userId, req.query);
        console.log('Product Analysis Response:', JSON.stringify(responseBody, null, 2));
        res.json(responseBody);
    } catch (error) {
        console.error('Error in product analysis:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
