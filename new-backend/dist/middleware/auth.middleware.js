"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const auth_1 = require("../utils/auth");
const session_model_1 = require("../models/session.model");
const authenticate = async (req, reply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return reply.status(401).send({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, auth_1.verifyToken)(token);
        if (payload.session_id) {
            const session = await session_model_1.Session.findOne({ session_id: payload.session_id, is_valid: true });
            if (!session) {
                return reply.status(401).send({ message: 'Session expired or invalidated' });
            }
            // Optional: Update last active time periodically or every request
            // await Session.updateOne({ _id: session._id }, { last_active: new Date() });
        }
        req.user = payload;
    }
    catch (err) {
        return reply.status(401).send({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
