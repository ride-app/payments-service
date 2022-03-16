# Compile Typescript
FROM node:16-alpine as build

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build

# Copy package.json and build node_modules 
FROM node:16-alpine as deps

WORKDIR /app
COPY package-lock.json package.json ./

RUN npm ci --production

# The instructions for second stage
FROM node:16-alpine

ENV NODE_ENV production

ARG FIREBASE_CONFIG
ENV FIREBASE_CONFIG ${FIREBASE_CONFIG}

WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/build build
COPY protos protos

CMD node build/main.js