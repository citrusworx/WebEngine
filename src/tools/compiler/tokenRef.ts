export type TokenRef = {
    family: string;
    step: string;
    raw: string;
}

export function parseTokenRef(input: string): TokenRef{
    if(!input){
        throw new Error("TokenRef cannot be empty!");
    }

    const raw = input.trim();

    let seperator = "";

    if(raw.includes(".")){
        seperator = ".";
    }
    else if(raw.includes("-")){
        seperator = "-";
    }
    else {
        throw new Error(`TokenRef "${raw}" must contain "." or "-" (example: blue-100)`);
    }

    const parts = raw.split(seperator);
    
    if(parts.length !== 2){
        throw new Error("Tokens must have a seperator.");
    }
    const family = parts[0].trim();
    const step = parts[1].trim();   
    if(!family){
        throw new Error("Token must contain a family");
    }

    if(!step){
        throw new Error("Token must contain a step. Ex: 100-900");
    }

    const stepString = Number(step);
    
    if(Number.isNaN(stepString)){
        throw new Error(`Token "${raw}" step must be numeric. Got ${step}`);
    }
    return {
        family, 
        step, 
        raw
    }
}
