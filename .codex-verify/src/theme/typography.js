"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typography = void 0;
const react_native_1 = require("react-native");
exports.typography = react_native_1.StyleSheet.create({
    h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
    h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    label: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
