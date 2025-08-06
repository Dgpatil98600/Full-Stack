import dotenv from 'dotenv';
dotenv.config(); 
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import Product from './models/Product.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import User from './models/User.js';
import inventoryRoutes from './routes/inventory.js';
import billRoutes from './routes/bill.js';
import crypto from 'crypto';
import productAnalysisRoutes from './routes/productAnalysis.js';
import notificationRoutes from './routes/notify.js';
import profileRoutes from './routes/profile.js'
import razorpayRoutes from './routes/razorpay.js';

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const otpStore = {};

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return /^\+[1-9]\d{1,14}$/.test(cleaned);
};

const requestLogger = (req, res, next) => {
  const start = Date.now();

  console.log('\n=== Request Details ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - start;
    console.log('\n=== Response Details ===');
    console.log(`[${new Date().toISOString()}] Response Time: ${responseTime}ms`);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    console.log('=== End of Request/Response ===\n');

    return originalJson.call(this, data);
  };

  next();
};

const errorLogger = (err, req, res, next) => {
  console.error('\n=== Error Details ===');
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}`);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('=== End of Error Details ===\n');
  
  res.status(500).json({ 
    error: 'An unexpected error occurred',
    message: err.message 
  });
};

app.use(requestLogger);
app.use(errorLogger);

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

app.post('/api/send-otp', async (req, res) => {
  try {
    console.log('Starting OTP send process...');
    const body = Object.assign({}, req.body);
    const { username, email, password, shopName, shopType, contact } = body;

    const cleanedContact = contact.replace(/\s+/g, '');
    console.log('Cleaned contact number:', cleanedContact);
    if (!cleanedContact) {
      console.log('Validation failed: Contact number is required');
      return res.status(400).json({ error: 'Contact number is required' });
    }

    if (!validatePhoneNumber(cleanedContact)) {
      console.log('Validation failed: Invalid phone number format');
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
      });
    }

    const usernameStr = String(username || '').trim();
    if (usernameStr === '') {
      console.log('Validation failed: Username is required');
      return res.status(400).json({ error: 'Username is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ error: 'Valid email is required' });
    }

    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { contact }] });
    if (existingUser) {
      console.log('User already exists with email or contact');
      return res.status(400).json({ 
        error: 'User with provided email or contact already exists' 
      });
    }

    console.log('Generating OTP...');
    const otp = crypto.randomInt(100000, 1000000).toString();
    console.log('Generated OTP:', otp);

    console.log('Twilio Configuration:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing',
      authToken: process.env.TWILIO_AUTH_TOKEN ? 'Configured' : 'Missing',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER ? 'Configured' : 'Missing'
    });

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio configuration is incomplete');
      return res.status(500).json({ 
        error: 'SMS service configuration is incomplete. Please contact support.' 
      });
    }

    try {
      console.log('Attempting to send SMS via Twilio...');
      const message = await twilioClient.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanedContact
      });
      console.log('SMS sent successfully:', message.sid);
    } catch (twilioError) {
      console.error('Twilio Error:', {
        code: twilioError.code,
        message: twilioError.message,
        moreInfo: twilioError.moreInfo
      });

      if (twilioError.code === 21211) {
        return res.status(400).json({ 
          error: 'Invalid phone number format. Please check the number and try again.' 
        });
      } else if (twilioError.code === 21214) {
        return res.status(400).json({ 
          error: 'The "From" phone number is not a valid Twilio phone number. Please contact support.' 
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to send OTP. Please try again later.' 
        });
      }
    }

    console.log('Storing OTP information...');
    otpStore[cleanedContact] = {
      otp,
      userData: { username: usernameStr, email, password, shopName, shopType, contact: cleanedContact },
      expires: Date.now() + 5 * 60 * 1000
    };
    console.log('Stored OTP data:', { contact: cleanedContact, otp });

    console.log('OTP process completed successfully');
    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Unexpected error in send-otp:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

app.post('/api/verify-otp', upload.none(), async (req, res) => {
  try {
    const { contact, otp } = req.body;
    const cleanedContact = contact.replace(/\s+/g, '');
    const record = otpStore[cleanedContact];
    if (!record) {
      return res.status(400).json({ success: false, error: 'OTP expired or invalid' });
    }
    if (Date.now() > record.expires) {
      delete otpStore[cleanedContact];
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
    otpStore[cleanedContact].verified = true;
    return res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'OTP verification failed' });
  }
});

app.post('/api/register', upload.single('proofFile'), async (req, res) => {
  try {
    const { username, email, password, shopName, shopType, contact } = req.body;
    const cleanedContact = contact.replace(/\s+/g, '');
    const record = otpStore[cleanedContact];
    if (!record || !record.verified) {
      return res.status(400).json({ success: false, error: 'OTP not verified' });
    }
  
    const existingUser = await User.findOne({ $or: [{ email }, { contact: cleanedContact }] });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      shopName,
      shopType,
      contact: cleanedContact,
      proofFile: req.file ? req.file.path : ''
    });
    await user.save();
    delete otpStore[cleanedContact];
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(201).json({ success: true, message: 'Registration successful', token });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1hr' });
    res.status(200).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
    console.error('Login error:', error);
  }
});


app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/bill', authenticate, billRoutes);
app.use('/api/product-analysis', authenticate, productAnalysisRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/razorpay', razorpayRoutes);

let lastBillCreationTime = null;

cron.schedule('* * * * *', async () => {
    try {
        console.log('Running scheduled expiry notification check...');
        
        const expiryResponse = await fetch('http://localhost:5000/api/notifications/notify', {
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
            }
        });
        
        if (!expiryResponse.ok) {
            const errorText = await expiryResponse.text();
            console.error('Failed to trigger expiry notification check:', {
                status: expiryResponse.status,
                statusText: expiryResponse.statusText,
                error: errorText
            });
        } else {
            const result = await expiryResponse.json();
            console.log('Expiry notification check completed:', {
                notificationsSent: result.notificationsSent,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in expiry notification cron job:', {
            message: error.message,
            stack: error.stack
        });
    }
});

cron.schedule('* * * * *', async () => {
    try {
        if (lastBillCreationTime && (Date.now() - lastBillCreationTime) < 3600000) {
            console.log('Skipping reorder check - bill was created in the last hour');
            return;
        }

        console.log('Running scheduled reorder notification check...');
     
        const reorderResponse = await fetch('http://localhost:5000/api/notifications/reorder-check', {
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
            }
        });

        if (!reorderResponse.ok) {
            const errorText = await reorderResponse.text();
            console.error('Failed to trigger reorder notification check:', {
                status: reorderResponse.status,
                statusText: reorderResponse.statusText,
                error: errorText
            });
        } else {
            const result = await reorderResponse.json();
            console.log('Reorder notification check completed:', {
                notificationsSent: result.notificationsSent,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in reorder notification cron job:', {
            message: error.message,
            stack: error.stack
        });
    }
});

app.post('/api/bill/create', authenticate, async (req, res) => {
    try {
       
        lastBillCreationTime = Date.now();
        const reorderResponse = await fetch('http://localhost:5000/api/notifications/reorder-check', {
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
            }
        });

        if (!reorderResponse.ok) {
            console.error('Failed to trigger reorder check after bill creation');
        }

        res.status(200).json({ message: 'Bill created successfully' });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ error: 'Failed to create bill' });
    }
});

const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();