import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

router.get('/', authenticate, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

router.put('/update/:userId', authenticate, async(req, res) => {
    try {
        const { username, email, contact, shopName, shopType } = req.body;
        if (req.params.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this profile' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { 
                username: username || undefined,
                email: email || undefined,
                contact: contact || undefined,
                shopName: shopName || undefined,
                shopType: shopType || undefined
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

export default router;