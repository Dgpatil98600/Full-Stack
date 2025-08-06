import express from 'express';
import Product from '../models/Product.js';
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

router.get('/categories', async (req, res) => {
    try {
        const userId = req.user.id;
        const categories = await Product.distinct('category', { user: userId });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    console.log('Product analysis route HIT');
    try {
        const userId = req.user.id;
        const { fromDate, toDate, category } = req.query;
        let dateFilter;
        if (fromDate && toDate) {
            dateFilter = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        } else {
            const range = req.query.range || '1m';
            const from = getDateFromRange(range);
            dateFilter = { $gte: from };
        }
        const bills = await Bill.find({ user: userId, date: dateFilter });
        console.log('Bills found:', bills.length);
        if (bills.length > 0) {
            console.log('Sample bill:', JSON.stringify(bills[0], null, 2));
        }

        const allItems = bills.flatMap(bill => bill.items.map(item => ({ ...item, billDate: bill.date })));
        console.log('All bill items:', allItems.length);
        if (allItems.length > 0) {
            console.log('Sample item:', JSON.stringify(allItems[0], null, 2));
        }
        if (allItems.length === 0) {
            return res.json({ totalProfit: 0, topProducts: [] });
        }

        const productIds = [...new Set(allItems.map(item => item.productId || (item._doc && item._doc.productId)))].filter(Boolean);
        console.log('Product IDs in bills:', productIds);

        const productQuery = { _id: { $in: productIds }, user: userId };
        if (category && category !== 'all') {
            productQuery.category = category;
        }

        const products = await Product.find(productQuery);
        console.log('Products found:', products.length);
        if (products.length > 0) {
            console.log('Sample product:', JSON.stringify(products[0], null, 2));
        }
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = {
                displayName: p.displayName,
                actualPrice: p.actualPrice,
                sellingPrice: p.sellingPrice,
                category: p.category
            };
        });

        const groupMap = {};
        let totalProfit = 0;
        allItems.forEach(item => {
            const prodId = item.productId || (item._doc && item._doc.productId);
            if (!prodId) return; 
            
            const prod = productMap[prodId.toString()];
            if (!prod) return; 

            const normalizedDisplayName = (prod.displayName || '').trim().toLowerCase();
            const quantity = Number((item._doc && item._doc.quantity != null) ? item._doc.quantity : item.quantity);
            const actualPrice = Number((item._doc && item._doc.actualPrice != null) ? item._doc.actualPrice : (item.actualPrice != null ? item.actualPrice : (prod.actualPrice)));
            const sellingPrice = Number((item._doc && item._doc.sellingPrice != null) ? item._doc.sellingPrice : (item.sellingPrice != null ? item.sellingPrice : (item._doc && item._doc.price != null) ? item._doc.price : item.price));
            if (isNaN(sellingPrice) || isNaN(actualPrice) || isNaN(quantity)) {
                console.warn('Skipping item due to NaN values:', { sellingPrice, actualPrice, quantity, item });
                return;
            }
            const profit = (sellingPrice - actualPrice) * quantity;
            totalProfit += profit;
            
            if (!groupMap[normalizedDisplayName]) {
                groupMap[normalizedDisplayName] = {
                    displayName: prod.displayName, 
                    totalProfit: 0,
                    productCount: 0,
                    category: prod.category
                };
            }
            groupMap[normalizedDisplayName].totalProfit += profit;
            groupMap[normalizedDisplayName].productCount += quantity;
            console.log(`Group: ${normalizedDisplayName}, Added profit: ${profit}, Added quantity: ${quantity}, Running totalProfit: ${groupMap[normalizedDisplayName].totalProfit}, Running productCount: ${groupMap[normalizedDisplayName].productCount}`);
        });

        const topProducts = Object.values(groupMap).map(g => ({
            displayName: g.displayName,
            totalProfit: typeof g.totalProfit === 'number' ? g.totalProfit : 0,
            productCount: typeof g.productCount === 'number' ? g.productCount : 0,
            category: g.category
        })).sort((a, b) => b.totalProfit - a.totalProfit);

        const responseBody = { totalProfit: typeof totalProfit === 'number' ? totalProfit : 0, topProducts };
        console.log('Product Analysis Response:', JSON.stringify(responseBody, null, 2));
        res.json(responseBody);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 