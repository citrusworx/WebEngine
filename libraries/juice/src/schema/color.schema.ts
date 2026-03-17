import { z } from "zod";

function isNumericString(s: string){
    if(!s) return false;

    for(let i = 0; i < s.length; i++){
        const c = s.charCodeAt(i);
        const isDigit = c >= 48 && c <= 57;
        if(!isDigit) return false;
    }
    return true;
}

export const ColorValue = z.string().min(1, "Color value cannot be empty");

export const ColorScale = z
    .record(z.string(), ColorValue)
    .superRefine((scale, ctx) => {
    // validate step keys
    for (const step of Object.keys(scale)) {
        if (!isNumericString(step)) {
        ctx.addIssue({
            code: "custom",
            message: `Step "${step}" must be numeric (example: 100..900).`,
            path: [step],
        });
        }
    }
});

export const ColorTokensFileSchema = z
    .record(z.string(), ColorScale)
    .superRefine((tokens, ctx) => {
        for(const family of Object.keys(tokens)){
            if(!family.trim()){
                ctx.addIssue({
                    code: "custom",
                    message: "Family name cannot be empty",
                    path: [family],
                });
            }
        }
    });

export type ColorTokensFile = z.infer<typeof ColorTokensFileSchema>;