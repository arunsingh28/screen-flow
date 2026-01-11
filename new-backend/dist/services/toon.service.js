"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toonService = exports.ToonService = void 0;
class ToonService {
    /**
     * Defines TOON serialization/deserialization.
     * Since 'toon_format' is not available in JS, we fall back to JSON or a simplified key-value format.
     * Based on python code, fallback allows straight JSON.
     */
    encode_data(data) {
        return JSON.stringify(data, null, 2);
    }
    decode_data(toonStr) {
        try {
            return JSON.parse(toonStr);
        }
        catch (e) {
            return toonStr;
        }
    }
    create_optimized_prompt(instruction, data, outputFormat = "JSON") {
        const encodedData = this.encode_data(data);
        return `${instruction.trim()}\n\nINPUT DATA (TOON format):\n${encodedData}\n\nReturn ONLY valid ${outputFormat}, no additional text.`;
    }
}
exports.ToonService = ToonService;
exports.toonService = new ToonService();
