"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.register = exports.login = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
const auth_1 = require("../utils/auth");
const session_model_1 = require("../models/session.model");
const uuid_1 = require("uuid");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
});
const login = async (req, reply) => {
    const { email, password } = req.body;
    const user = await user_model_1.User.findOne({ email });
    if (!user || !(await (0, auth_1.comparePassword)(password, user.password_hash))) {
        return reply.status(401).send({ message: 'Invalid credentials' });
    }
    // Create Session
    const session_id = (0, uuid_1.v4)();
    await session_model_1.Session.create({
        user_id: user._id,
        session_id,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
    });
    const token = (0, auth_1.generateToken)({ id: user._id, email: user.email, role: user.role }, session_id);
    return {
        token: {
            access_token: token,
            token_type: 'bearer',
        },
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        }
    };
};
exports.login = login;
const register = async (req, reply) => {
    const { email, password, first_name, last_name } = req.body;
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' });
    }
    const password_hash = await (0, auth_1.hashPassword)(password);
    const user = await user_model_1.User.create({
        email,
        password_hash,
        first_name,
        last_name,
        role: 'USER' // default
    });
    // Create Session
    const session_id = (0, uuid_1.v4)();
    await session_model_1.Session.create({
        user_id: user._id,
        session_id,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
    });
    const token = (0, auth_1.generateToken)({ id: user._id, email: user.email, role: user.role }, session_id);
    return {
        token: {
            access_token: token,
            token_type: 'bearer',
        },
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        }
    };
};
exports.register = register;
const refreshToken = async (req, reply) => {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
        return reply.status(401).send({ message: 'Refresh token not found' });
    }
    try {
        const { env } = require('../config/env');
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(refreshToken, env.JWT_SECRET);
        // Check if user exists and is not blocked
        const user = await user_model_1.User.findById(payload.user_id || payload.id);
        if (!user || user.is_blocked) {
            return reply.status(401).send({ message: 'User invalid' });
        }
        // Verify Session
        if (payload.session_id) {
            const session = await session_model_1.Session.findOne({ session_id: payload.session_id, is_valid: true });
            if (!session) {
                return reply.status(401).send({ message: 'Session expired or invalidated' });
            }
            // Update last active
            session.last_active = new Date();
            await session.save();
        }
        const newToken = (0, auth_1.generateToken)({ id: user._id, email: user.email, role: user.role }, payload.session_id);
        return {
            token: {
                access_token: newToken,
                token_type: 'bearer'
            }
        };
    }
    catch (e) {
        return reply.status(401).send({ message: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, reply) => {
    // Invalidate session if present in token
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            // Decode without verification just to get session_id, or verify if we want strictness
            // We can reuse verifyToken utility or just decode
            const jwt = require('jsonwebtoken'); // Assuming verify checks signature
            const decoded = jwt.decode(token);
            if (decoded && decoded.session_id) {
                await session_model_1.Session.deleteOne({ session_id: decoded.session_id });
            }
        }
    }
    catch (e) {
        req.log.warn({ err: e }, 'Logout session invalidation failed');
    }
    reply.clearCookie('refresh_token', { path: '/' });
    return { message: 'Successfully logged out' };
};
exports.logout = logout;
