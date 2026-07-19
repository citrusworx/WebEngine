import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { RequestContext } from "@citrusworx/seltzer";
import type { Posts, Pages } from "@citrusworx/kiwipress";
import type { ProductRecord } from "../data/seed-products.js";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AppLocals = {
  products: ProductRecord[];
  waitlist: WaitlistEntry[];
  postsClient: Posts | null;
  pagesClient: Pages | null;
  wpUrl: string | null;
  nectarine: NectarineConfig;
};

export type BlackwaterContext = RequestContext<AppLocals>;
