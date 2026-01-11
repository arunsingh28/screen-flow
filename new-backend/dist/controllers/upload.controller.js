"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const uploadFile = async (req, reply) => {
    const { key } = req.query;
    if (!key)
        return reply.status(400).send({ message: 'Key is required' });
    // Ensure key is safe - simple check
    if (key.includes('..'))
        return reply.status(400).send({ message: 'Invalid key' });
    const uploadsDir = path_1.default.join(__dirname, '../../uploads');
    const filePath = path_1.default.join(uploadsDir, key);
    const dir = path_1.default.dirname(filePath);
    await fs_1.default.promises.mkdir(dir, { recursive: true });
    const isMultipart = req.headers['content-type']?.startsWith('multipart/form-data');
    if (isMultipart) {
        const data = await req.file();
        if (data) {
            await (0, promises_1.pipeline)(data.file, fs_1.default.createWriteStream(filePath));
            return reply.send({ message: 'Uploaded successfully' });
        }
    }
    // Handle raw stream (PUT /file)
    await (0, promises_1.pipeline)(req.body, fs_1.default.createWriteStream(filePath));
    return reply.send({ message: 'Uploaded successfully' });
};
exports.uploadFile = uploadFile;
