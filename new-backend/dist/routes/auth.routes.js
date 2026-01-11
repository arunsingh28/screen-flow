"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const auth_controller_1 = require("../controllers/auth.controller");
const authRoutes = async (app) => {
    app.withTypeProvider().post('/login', {
        schema: {
            body: auth_controller_1.loginSchema,
        },
    }, auth_controller_1.login);
    app.withTypeProvider().post('/register', {
        schema: {
            body: auth_controller_1.registerSchema,
        },
    }, auth_controller_1.register);
    app.post('/refresh', auth_controller_1.refreshToken);
    app.post('/logout', auth_controller_1.logout);
};
exports.authRoutes = authRoutes;
