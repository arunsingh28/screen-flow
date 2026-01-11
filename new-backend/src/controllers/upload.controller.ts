import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export const uploadFile = async (req: FastifyRequest<{ Querystring: { key: string } }>, reply: FastifyReply) => {
    const { key } = req.query;
    if (!key) return reply.status(400).send({ message: 'Key is required' });

    // Ensure key is safe - simple check
    if (key.includes('..')) return reply.status(400).send({ message: 'Invalid key' });

    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, key);
    const dir = path.dirname(filePath);

    await fs.promises.mkdir(dir, { recursive: true });

    const isMultipart = req.headers['content-type']?.startsWith('multipart/form-data');

    if (isMultipart) {
        const data = await (req as any).file();
        if (data) {
            await pipeline(data.file, fs.createWriteStream(filePath));
            return reply.send({ message: 'Uploaded successfully' });
        }
    }

    // Handle raw stream (PUT /file)
    await pipeline(req.body as any, fs.createWriteStream(filePath));
    return reply.send({ message: 'Uploaded successfully' });
};
