import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { UserModel } from './models';

dotenv.config({ path: path.join(__dirname, '.env') });

const reset = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found in environment');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await UserModel.deleteMany({ role: 'admin' });
        console.log(`Successfully removed ${result.deletedCount} admin users.`);
        console.log('Admin system is now reset for the Setup Key flow.');

    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

reset();
