import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const payload = { role: 'admin_cron_job' };
const secret = process.env.JWT_SECRET;

if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    console.error('Please make sure you have JWT_SECRET set in your backend/.env file.');
    process.exit(1);
}

const token = jwt.sign(payload, secret, { expiresIn: '365d' });
console.log('Generated Admin Token:');
console.log(token);