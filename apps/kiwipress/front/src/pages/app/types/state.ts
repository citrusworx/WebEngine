import { Signal } from "@citrusworx/sigjs";
import { listTypes } from "./api";
import type { TypeDefinition } from "./model";

export const registeredTypes = Signal<TypeDefinition[]>([]);

export async function refreshRegisteredTypes(): Promise<TypeDefinition[]> {
    const types = await listTypes();
    registeredTypes.set(types);
    return types;
}
