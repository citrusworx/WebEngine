/// <reference types="vite/client" />

declare module "virtual:juice-docs" {
  import type { DocsCatalog } from "./docs/types";

  export const catalog: DocsCatalog;
}
