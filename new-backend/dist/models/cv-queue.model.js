"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CVQueue = exports.QueueStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["PENDING"] = "pending";
    QueueStatus["PROCESSING"] = "processing";
    QueueStatus["COMPLETED"] = "completed";
    QueueStatus["FAILED"] = "failed";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
const CVQueueSchema = new mongoose_1.Schema({
    cv_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CV', required: true, index: true },
    batch_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true },
    s3_key: { type: String, required: true },
    status: { type: String, enum: Object.values(QueueStatus), default: QueueStatus.PENDING, index: true },
    max_retries: { type: Number, default: 3 },
    attempts: { type: Number, default: 0 },
    priority: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
exports.CVQueue = mongoose_1.default.model('CVQueue', CVQueueSchema);
