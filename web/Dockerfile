FROM node:22-alpine AS build
WORKDIR /app
COPY web/package*.json ./web/
COPY packages/contracts ./packages/contracts
RUN cd web && npm install --no-audit --no-fund
COPY web ./web
RUN cd web && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/web/.next/standalone ./
COPY --from=build /app/web/.next/static ./web/.next/static
EXPOSE 3000
CMD ["node", "web/server.js"]
