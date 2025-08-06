import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const bills = await Bill.find({});
  for (const bill of bills) {
    let updated = false;
    for (const item of bill.items) {
      if (!item.productId && item.productName) {
        const product = await Product.findOne({ name: item.productName, user: bill.user });
        if (product) {
          item.productId = product._id;
          updated = true;
        }
      }
    }
    if (updated) {
      await bill.save();
      console.log(`Updated bill ${bill._id}`);
    }
  }
  console.log('Migration complete');
  process.exit(0);
}

migrate(); 