import type { IncomingMessage } from "node:http";
export type KiwiPressGatewayOptions = {
    token?: string;
    allowLoopbackWithoutToken?: boolean;
};
export declare function isLoopbackAddress(address?: string | null): boolean;
export declare function readGatewayToken(req: IncomingMessage): string;
export declare function authorizeKiwiPressGateway(req: IncomingMessage, options?: KiwiPressGatewayOptions): boolean;
