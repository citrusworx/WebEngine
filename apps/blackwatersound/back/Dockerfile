# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY tsconfig.json tsconfig.base.json ./
COPY .yarn ./.yarn
COPY libraries ./libraries
COPY packages ./packages
COPY engines ./engines
COPY apps ./apps
COPY tooling ./tooling

RUN yarn install --immutable
RUN yarn workspace @citrusworx/seltzer build
RUN yarn workspace @citrusworx/nectarine build
RUN yarn workspace @citrusworx/kiwipress build
RUN yarn workspace @citrusworx/blackwater-sound-back build

# Keep monorepo paths so Yarn workspace symlinks in node_modules resolve.
FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV NECTARINE_CONFIG=/repo/apps/blackwatersound/back/nectarine.config.yaml

COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/libraries ./libraries
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/blackwatersound/back/package.json ./apps/blackwatersound/back/package.json
COPY --from=build /repo/apps/blackwatersound/back/dist ./apps/blackwatersound/back/dist
COPY --from=build /repo/apps/blackwatersound/back/nectarine.config.yaml ./apps/blackwatersound/back/nectarine.config.yaml
COPY --from=build /repo/apps/blackwatersound/back/src/schemas ./apps/blackwatersound/back/src/schemas
COPY apps/blackwatersound/back/docker-entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

WORKDIR /repo/apps/blackwatersound/back
EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/server.js"]
