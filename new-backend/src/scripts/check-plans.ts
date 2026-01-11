import { connectDB } from '../config/db';
import { Plan } from '../models/plan.model';
import { seedDefaultPlans } from '../services/bootstrap.service';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

const checkAndSeed = async () => {
    try {
        await connectDB();
        console.log('Connected to database.');

        const count = await Plan.countDocuments();
        console.log(`Current plan count: ${count}`);

        if (count === 0) {
            console.log('No plans found. Seeding default plans...');
            await seedDefaultPlans();
            const newCount = await Plan.countDocuments();
            console.log(`New plan count: ${newCount}`);
        } else {
            console.log('Plans already exist. Skipping seeding.');
            const plans = await Plan.find({}, { name: 1, code: 1 });
            console.log('Existing plans:', plans);
        }

    } catch (error) {
        console.error('Error checking/seeding plans:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
};

checkAndSeed();
