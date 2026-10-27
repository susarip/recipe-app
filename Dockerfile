# Builds and runs the app. Used by Fly.io now and by any VPS later (docker compose).
FROM node:24-slim AS build
WORKDIR /src
COPY recipe-schema.ts ./
COPY data/canonical-ingredients.csv data/swap-groups.csv ./data/
COPY app/package.json app/package-lock.json ./app/
RUN cd app && npm ci
COPY app ./app
RUN cd app && npm run build && npm prune --omit=dev

FROM node:24-slim
WORKDIR /srv
ENV NODE_ENV=production PORT=3000 DATABASE_FILE=/data/recipes.db DATA_DIR=/srv/data
COPY --from=build /src/app/build ./build
COPY --from=build /src/app/node_modules ./node_modules
COPY --from=build /src/app/package.json ./
COPY --from=build /src/data ./data
VOLUME /data
EXPOSE 3000
CMD ["node", "build"]
