"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapInsert = mapInsert;
exports.mapGetter = mapGetter;
exports.getValues = getValues;
function mapInsert(action) {
    const vars = action.updates.values.map(value => {
        if (typeof value === 'object') {
            return '?';
        }
        return value;
    })
        .join(', ');
    return vars;
}
function mapGetter(action) {
    const vars = action.statement.values.map(value => {
        if (typeof value === 'object') {
            return '?';
        }
        return value;
    })
        .join(', ');
    console.log(vars);
    return vars;
}
function getValues(action) {
    const values = action.statement.column.join(', ');
    return values;
}
//# sourceMappingURL=msqlUtil.js.map