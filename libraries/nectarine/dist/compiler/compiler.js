"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCompiler = void 0;
const util_1 = require("../util/util");
class CCompiler {
    // Create a class for compiling the different shapes of configs in Nectarine
    parse_config(config) {
        const parse = util_1.parser.yaml(config);
        return parse;
    }
    clean_parse(parsedConfig, method, type) {
        const clean = parsedConfig[method][type];
        return clean;
    }
    buildQuery(cleanedConfig, query) {
        const qobj = cleanedConfig[query];
        // Craft the proper SQL statement
    }
}
exports.CCompiler = CCompiler;
// Implementation looks like this
// TODO: Config driven compiler
// const compiler = new CCompiler();
// 
// const parse = compiler.parse_config('./nectar/models/user/sql.yml')
// const clean = compiler.clean_parse(parse, 'get', 'user')
// const getUserById = compiler.buildQuery(clean, 'GetUserById')
// const getAllUsers = compiler.buildQuery(clean, 'GetAllUsers') // Builds a SQL statement
// 
// You would then pass the getUserById variable into the DB adapter to
// query your Relational database of choice.
// 
// export function query(query: string){
//  pg.connect()
//  pg.execute(query)
//  pg.disconnect()
// }
// 
// query(getAllUsers)
//# sourceMappingURL=compiler.js.map