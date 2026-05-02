<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Pichichi notes

### CORS_ORIGINS (REST + WebSocket)

The `CORS_ORIGINS` env var is a comma-separated allow-list applied to **both** the REST API and the Socket.IO `/events` namespace. In production it MUST include every web origin that should be able to connect, including the PWA shell:

```
CORS_ORIGINS=https://pichichi.app,https://pichichi.app/app
```

For local development the default in `.env.example` covers the Next.js web app (`http://localhost:3001`) and the Expo dev client (`http://localhost:8081`).

### Socket authentication

`EventsGateway` (`src/gateways/events.gateway.ts`) verifies the JWT during the WebSocket handshake. Clients must send the access token via `client.handshake.auth.token` (preferred) or an `Authorization: Bearer <token>` header. Connections without a valid token are dropped with `client.disconnect(true)`.

### Rollout order

When deploying changes that touch the socket handshake, deploy the **backend first**. Already-connected clients will be disconnected on restart and reconnect automatically with their stored access token, so no client-side change is required for mobile or the web PWA.

### Deploy Checklist (Manual)

> **Vercel and Railway are operated manually. NO push automático. NO deploy automático.** Agents and CI MUST NOT run `vercel deploy`, `vercel --prod`, `railway up`, or any deploy CLI.

Order: **backend first (Railway) → web (Vercel)**. This guarantees clients reconnect against an API that already speaks the new contract.

#### 1. Railway (API)

Required env vars (set via Railway dashboard → Variables):

- `DATABASE_URL` — PostgreSQL connection string (Railway-managed instance).
- `JWT_SECRET` — long random secret for access/refresh signing.
- `JWT_REFRESH_SECRET` — separate secret for refresh tokens.
- `CORS_ORIGINS` — comma-separated allow-list. MUST include the Vercel web domain (and any preview domains you want to allow).
- `REDIS_URL` — Redis connection string for socket adapter / queues.
- `GOOGLE_CLIENT_ID` — Google OAuth Web client ID (matches the one used by web/mobile).
- `APPLE_*` — Apple Sign-In credentials if enabled.
- Any API-Football / external service keys used by importers.

Steps:

1. Verify Prisma migrations are committed.
2. Trigger the Railway deploy (manual button or `git push` to the deploy branch — human action).
3. After deploy, smoke check: `curl https://<api-host>/health` returns `200`.

#### 2. Vercel (Web)

Required env vars (Vercel dashboard → Project → Settings → Environment Variables):

- `NEXT_PUBLIC_API_URL` — Railway API base URL (e.g. `https://api.pichichi.app`).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — same Google Web client ID. Make sure the Vercel domain is listed under Authorized JavaScript origins in Google Cloud Console.

Steps:

1. Confirm the API is healthy.
2. Trigger the Vercel deploy (human action).
3. After deploy, smoke check: open `/app/login`, perform Google login, confirm dashboard renders and the WebSocket handshake succeeds (DevTools → Network → WS → `/events` → status 101).

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
