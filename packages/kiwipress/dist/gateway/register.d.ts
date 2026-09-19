import type { Seltzer } from "@citrusworx/seltzer";
import { KiwiPress } from "../cms/KiwiPress.js";
import { type KiwiPressGatewayOptions } from "./auth.js";
export declare function registerKiwiPressGateway(app: Seltzer, kiwi: KiwiPress, options?: KiwiPressGatewayOptions): Seltzer;
