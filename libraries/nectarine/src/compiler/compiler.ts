import { parser } from "../util/util"

export type optokens = {
    eq: "=",
    gt: ">",
    lt: "<",
    lte: "<=",
    gte: ">=",
    neq: "!="
}


export class CCompiler {
    
    // Create a class for compiling the different shapes of configs in Nectarine

    parse_config(config: string): Record<string, string>{
        const parse = parser.yaml(config)
        return parse;
    }

    clean_parse(parsedConfig: any, method: string, type: string): Record<string, string>{
        const clean: Record<string, string> = parsedConfig[method][type]
        return clean;

    }

    buildQuery(cleanedConfig: Record<string, string>, query: string){
        const qobj = cleanedConfig[query]
        // Craft the proper SQL statement
    }
}

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