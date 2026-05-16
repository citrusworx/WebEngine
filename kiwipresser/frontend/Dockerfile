FROM node:20

RUN corepack enable

WORKDIR /workspace

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json tsconfig.json turbo.json ./
COPY .yarn ./.yarn

COPY apps/kiwipress ./apps/kiwipress
COPY packages/kiwipress ./packages/kiwipress
COPY libraries/juice ./libraries/juice
COPY libraries/nectarine ./libraries/nectarine
COPY libraries/seltzer ./libraries/seltzer
COPY libraries/sig ./libraries/sig

RUN yarn install

EXPOSE 5173

CMD ["yarn", "workspace", "@citrusworx/kiwipressapp", "dev", "--host", "0.0.0.0", "--port", "5173"]
