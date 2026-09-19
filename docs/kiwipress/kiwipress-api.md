# KiwiPress API Reference

Public surface of `@citrusworx/kiwipress` **0.4.3** as exported from `packages/kiwipress/src/index.ts`.

This page is the compact contract. Mental model: [README](./README.md). Behavior: the topic pages.

## Package exports

From the package root (no subpath exports):

**Core** — `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`

**Normalize** — `extractTextValue`, `asCollection`, `normalizeWordPressItem`, `normalizeWordPressCollection`, `toNectarinePost`

**CMS** — `KiwiPress`, `NectarineStore`, `NativeCollection`, `createNativeCms`, `CMS_COLLECTIONS`, type-registry helpers (`normalizeTypeDefinition`, `isCustomTypeSlug`, …)

**Persistence** — `createFilePersistence`, `createPostgresPersistence`, `persistenceFromEnv`, `emptySnapshot`, `emptyDocument`, `normalizeSnapshot`, `normalizeDocument`, `isCmsCollection`

**Nectarine YAML** — `loadNectarineApi`, `loadNectarineApiFile`

**Gateway** — `registerKiwiPressGateway`, `authorizeKiwiPressGateway`, `readGatewayToken`, `isLoopbackAddress`

**Routes / domain** — `Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments` and their `createWordPressRoute` / `createAliasedQueryRoute` route constants (`getAllPosts`, `getPostBySlug`, …)

**Route utils** — `requestWordPress`, `requestWordPressPage`, `createWordPressRoute`, `createAliasedQueryRoute`, `createAliasedQueryRouteFromKeys`, `getLastParam`, `buildCollectionQueryEndpoint`

**Types** — `WPCoreConfig`, `RouteParams`, `AuthStrategy`, `WPAuthCredentials`, `WordPressPayload`, `ApiDefinition`, `CmsMode`, `CmsCollection`, `CollectionSlug`, `CollectionTypeDefinition`, `CmsDocument`, `ContentRecord`, `ContentStatus`, `NectarinePost`, `CmsSnapshot`, `TransferResult`, `TransferPreview`, `CmsPersistence`, `CmsPersistenceKind`, `PostgresPersistenceOptions`, `SqlExecutor`, `KiwiPressConfig`, `KiwiPressGatewayOptions`, `NectarineApiRoute`, `WordPressClients`, `WordPressPage`, `NativeCms`

`example.ts` is not exported.

## `KiwiPress`

```ts
static connect(config?: KiwiPressConfig): KiwiPress
constructor(config?: KiwiPressConfig)

ready(): Promise<this>
persist(): Promise<void>
get persistence(): CmsPersistence | undefined
get wordpress(): WordPressClients  // throws without URL
toNectarine(store?: NectarineStore): KiwiPress
promote(): this
useWordPress(): this              // throws without URL

readonly auth: WPAuth
readonly store: NectarineStore
readonly native: NativeCms
readonly sync?: WPSync
mode: CmsMode
```

`KiwiPressConfig` is `Partial<WPCoreConfig>` plus `mode?`, `store?`, `persistence?`.

## Domain classes

See [Domain objects](./kiwipress-domain.md) for method tables. Constructors: `new Posts(config?: Partial<WPCoreConfig>)` (same for Pages, Users, Categories, Tags, Comments).

`WPClient.listAll(collection, query?)` is public on every domain instance.

## `WPAuth`

```ts
new WPAuth(credentials?: WPAuthCredentials)
static fromConfig(config: WPAuthCredentials): WPAuth
strategy(): AuthStrategy
isConfigured(): boolean
headers(): Record<string, string>
```

## `WPSync`

```ts
preview(collections?: CmsCollection[]): Promise<TransferPreview>
transfer(collections?: CmsCollection[]): Promise<TransferResult>
```

Default collections: all six.

## Persistence helpers

```ts
createFilePersistence(filePath: string): CmsPersistence
createPostgresPersistence(options?: {
  database?: string;
  table?: string;
  executor?: SqlExecutor;
}): CmsPersistence
persistenceFromEnv(env?: Record<string, string | undefined>): CmsPersistence | undefined
```

## Gateway

```ts
registerKiwiPressGateway(
  app: Seltzer,
  kiwi: KiwiPress,
  options?: KiwiPressGatewayOptions
): Seltzer

authorizeKiwiPressGateway(req: IncomingMessage, options?: KiwiPressGatewayOptions): boolean
```

Route table: [Gateway](./kiwipress-gateway.md).

## Normalize

```ts
normalizeWordPressItem(collection: CmsCollection, value: unknown, sourceUrl?: string): ContentRecord
normalizeWordPressCollection(collection, value, sourceUrl?): ContentRecord[]
toNectarinePost(record: ContentRecord): NectarinePost
extractTextValue(value: unknown): string
asCollection(value: unknown): unknown[]
```

## YAML

```ts
loadNectarineApi(data: YAMLdata | Record<string, unknown>): NectarineApiRoute[]
loadNectarineApiFile(filepath: string): NectarineApiRoute[]
```

## Route factories

```ts
createWordPressRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint>
createAliasedQueryRoute(config, collection, queryKey): Route<Endpoint>
createAliasedQueryRouteFromKeys(config, collection, queryKeys): Route<Endpoint>
requestWordPress(ctx: Endpoint, init?: RequestInit): Promise<any>
requestWordPressPage(ctx: Endpoint, init?: RequestInit): Promise<WordPressPage>
```

`Route` / `Endpoint` are Seltzer types. Handlers on these routes call `fetch`, they do not return `ResponseData` for `listen`.

## Env vars (Node)

| Var | Used by |
|---|---|
| `WP_URL` | `WPCore`, `KiwiPress` |
| `WP_API` | `apiBase` |
| `WP_USER` / `WP_APP_PASSWORD` | Basic |
| `WP_TOKEN` | Bearer |
| `WP_API_KEY` | `X-API-Key` |
| `WP_ALLOW_SELF_SIGNED` | `1` / `true` / `yes` |
| `KIWIPRESS_CMS_FILE` | `persistenceFromEnv` file |
| `KIWIPRESS_PG_DB` / `PG_DB` | `persistenceFromEnv` Postgres |
| `KIWIPRESS_GATEWAY_TOKEN` | dashboard backend (not read by the library constructor) |
| `KIWIPRESS_API_PORT` | dashboard backend |
| `VITE_KIWIPRESS_GATEWAY_TOKEN` | dashboard front |
