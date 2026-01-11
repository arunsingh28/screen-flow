import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async () => {
    try {
        await connectDB();
        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        console.log(`Server running on port ${env.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
