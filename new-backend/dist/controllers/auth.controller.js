"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
const auth_1 = require("../utils/auth");
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
    const token = (0, auth_1.generateToken)({ id: user._id, email: user.email, role: user.role });
    return {
        access_token: token,
        token_type: 'bearer',
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
    const token = (0, auth_1.generateToken)({ id: user._id, email: user.email, role: user.role });
    return {
        access_token: token,
        token_type: 'bearer',
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
