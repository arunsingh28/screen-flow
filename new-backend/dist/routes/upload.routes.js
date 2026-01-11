"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const zod_1 = require("zod");
const upload_controller_1 = require("../controllers/upload.controller");
const uploadRoutes = async (app) => {
    app.addContentTypeParser('*', (req, payload, done) => {
        done(null, payload);
    });
    app.withTypeProvider().put('/', {
        schema: {
            querystring: zod_1.z.object({
                key: zod_1.z.string()
            })
        },
        // specific config to allow large payload
        bodyLimit: 1048576 * 10, // 10MB
    }, upload_controller_1.uploadFile);
};
exports.uploadRoutes = uploadRoutes;
