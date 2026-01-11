import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { seedDefaultPlans } from './services/bootstrap.service';

const start = async () => {
    try {
        await connectDB();
        await seedDefaultPlans();
        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        app.log.info(`Server running on port ${env.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
