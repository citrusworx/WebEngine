import { type CollectionTypeDefinition } from "./types.js";
export declare const PERSISTED_TYPES_COLLECTION = "__types";
export type TypeDefinitionInput = {
    slug?: unknown;
    label?: unknown;
    singular?: unknown;
    statuses?: unknown;
    fields?: unknown;
};
export declare function isReservedCollectionSlug(value: string): boolean;
export declare function isCustomTypeSlug(value: string): boolean;
export declare function isCollectionSlug(value: string): boolean;
export declare function isEditableGatewayCollection(value: string): boolean;
export declare function normalizeTypeDefinition(input: TypeDefinitionInput, existing?: CollectionTypeDefinition): CollectionTypeDefinition;
export declare function asTypeDefinition(value: unknown): CollectionTypeDefinition | null;
