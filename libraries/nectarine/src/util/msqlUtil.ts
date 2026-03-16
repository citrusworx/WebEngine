interface MapInsertface {
    type: string;
    action: string;
    table: string;
    updates: {
        column: string[];
        values: string[];
    };
}

interface MapGetterface {
    type: string;
    action: string;
    table: string;
    clause: string;
    statement:
    {
        column: string[];
        values: string[];
    };
}

export function mapInsert(action: MapInsertface): string {
    const vars = action.updates.values.map(value => {
        if(typeof value === 'object'){
            return '?';
        }
        return value;
    })
        .join(', ');

        return vars;
}

export function mapGetter(action: MapGetterface): string {
    const vars = action.statement.values.map(value => {
        if(typeof value === 'object'){
            return '?';
        }
        return value;
    })
        .join(', ');
        console.log(vars);
        return vars;
}

export function getValues(action: MapGetterface){
    const values = action.statement.column.join(', ');
    return values;
}