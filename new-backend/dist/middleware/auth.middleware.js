"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const auth_1 = require("../utils/auth");
const authenticate = async (req, reply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return reply.status(401).send({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, auth_1.verifyToken)(token);
        req.user = payload;
    }
    catch (err) {
        return reply.status(401).send({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
