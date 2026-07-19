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

ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE

RUN yarn install --immutable
RUN yarn workspace @citrusworx/sigjs build
RUN yarn workspace @citrusworx/juiceui build
RUN yarn workspace @citrusworx/blackwater-sound build

FROM nginx:1.27-alpine AS runtime
COPY apps/blackwatersound/docker/nginx/front.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/blackwatersound/front/dist /usr/share/nginx/html
EXPOSE 80
