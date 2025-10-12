import express from 'express';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/add', async (req, res) => {
    try {
        let { displayName, name, notify } = req.body;
        if (!displayName || displayName.trim() === "") {
            if (name && name.trim() !== "") {
                displayName = name;
            } else {
                return res.status(400).json({ message: 'Display Name is required.' });
            }
        }
        const newProduct = new Product({
            ...req.body,
            displayName,
            notify,
            user: req.user.id,
            dateAdded: Date.now(),
            dateUpdated: Date.now()
        });
        await newProduct.save();
        console.log('Product added and saved:', newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/list', async (req, res) => {
    try {
        const { search } = req.query;
        let query = { user: req.user.id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { supplier: { $regex: search, $options: 'i' } },
            ];
        }

        const products = await Product.find(query).select('name displayName sku category actualPrice sellingPrice quantity reorderLevel supplier expirationDate dateAdded dateUpdated user notify').sort({ displayName: 1, name: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/update-product/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        let { name, quantity, actualPrice, sellingPrice, reorderLevel, displayName, notify } = req.body;
        if (!displayName || displayName.trim() === "") {
            if (name && name.trim() !== "") {
                displayName = name;
            } else {
                return res.status(400).json({ message: 'Display Name is required.' });
            }
        }
        const product = await Product.findOneAndUpdate(
            { sku, user: req.user.id },
            {
                name,
                displayName,
                quantity: parseInt(quantity),
                actualPrice: parseFloat(actualPrice),
                sellingPrice: parseFloat(sellingPrice),
                reorderLevel: parseInt(reorderLevel),
                notify,
                dateUpdated: Date.now(),
            },
            { new: true }
        );

        console.log('Product updated and saved:', product);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        const deletedProduct = await Product.findOneAndDelete({ sku, user: req.user.id });

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Notification.deleteMany({ 
            productId: deletedProduct._id,
            userId: req.user.id 
        });

        res.status(200).json({ message: 'Product and associated notifications deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/migrate-displayname', async (req, res) => {
    try {
        const result = await Product.updateMany(
            { $or: [ { displayName: { $exists: false } }, { displayName: "" } ] },
            [ { $set: { displayName: "$name" } } ]
        );
        res.status(200).json({ message: 'Migration complete', modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;