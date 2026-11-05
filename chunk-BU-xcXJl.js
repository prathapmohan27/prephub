var e={"What is CI/CD and what tools have you used?":{summary:`CI (Continuous Integration) means every push is automatically built, linted and tested so integration problems surface within minutes. CD means the validated build is automatically released — Continuous Delivery keeps it always deployable with a manual approval, Continuous Deployment ships every passing change to production. Common tools are GitHub Actions, GitLab CI, Jenkins, CircleCI, plus Docker, Kubernetes and Argo CD for deployment.`,details:[{type:`paragraph`,text:`This is half concept, half experience question. Explain the pipeline stages, then describe a pipeline you actually worked with: what ran on pull requests, how images were built, how deploys and rollbacks worked. Use placeholders like [your project] and fill them with your real setup.`},{type:`heading3`,text:`Typical pipeline for a Node.js service`},{type:`flow`,title:`From push to production`,code:`flowchart LR
  A[git push / PR]:::client --> B["CI: install, lint,<br/>type-check, test"]:::server
  B --> C["Build Docker image<br/>+ security scan"]:::server
  C --> D[("Registry<br/>image:sha")]:::db
  D --> E[Deploy to staging]:::network
  E --> F["Smoke / E2E tests"]:::server
  F --> G{Approval?}:::highlight
  G -->|yes| H["Production<br/>rolling or canary"]:::network
  H --> I["Monitor, auto-rollback<br/>on errors"]:::security`},{type:`code`,lang:`yaml`,code:`# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run typecheck
      - run: npm test -- --coverage
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/postgres }

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production        # can require manual approval
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/acme/api:\${{ github.sha }} .
      - run: docker push ghcr.io/acme/api:\${{ github.sha }}
      - run: ./scripts/deploy.sh \${{ github.sha }}`},{type:`heading3`,text:`Tools by stage`},{type:`bullets`,items:[`**CI servers:** GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure DevOps, Bitbucket Pipelines.`,"**Quality gates:** ESLint, `tsc`, Jest/Vitest, SonarQube, `npm audit`/Snyk, Trivy for image scanning.","**Artifacts:** Docker images in ECR, GHCR, Docker Hub, tagged with the commit SHA (never just `latest`).",`**Deployment:** Kubernetes with Helm or Kustomize, Argo CD/Flux (GitOps), AWS ECS, serverless, or PM2 over SSH for simple setups.`,`**Release strategies:** rolling update, blue-green, canary, feature flags to decouple deploy from release.`]},{type:`callout`,variant:`tip`,text:`Sample answer structure: "In [your project] we used [GitHub Actions]. PRs ran lint, unit and integration tests against a Postgres service container; merges to main built an image tagged with the SHA, deployed to staging, ran smoke tests and then promoted to production with a manual approval. Rollback was redeploying the previous SHA." Concrete details beat a list of tool names.`}]},"What is Docker and how is it used with Node.js?":{summary:"Docker packages an application with its runtime, OS libraries and dependencies into an image, which runs as an isolated container the same way on a laptop, in CI and in production. For Node.js you build an image from a `node` base image, install dependencies, copy the code and run `node server.js`; Docker Compose then runs it locally alongside Postgres, Redis and so on.",details:[{type:`paragraph`,text:`Containers are not virtual machines: they share the host kernel and isolate processes using namespaces and cgroups, so they start in milliseconds and are lightweight. The main benefit is **reproducibility** — the "works on my machine" problem goes away because the same image goes from CI to production.`},{type:`heading3`,text:`Key concepts`},{type:`bullets`,items:["**Image** — read-only, layered template built from a Dockerfile (e.g. `acme/api:1.4.2`).",`**Container** — a running instance of an image with its own filesystem, network and process space.`,`**Registry** — stores images (Docker Hub, ECR, GHCR).`,`**Volume** — persistent storage outside the container lifecycle (databases, uploads).`,"**Network** — containers on the same Compose network reach each other by service name (`postgres:5432`)."]},{type:`heading3`,text:`Local development with Docker Compose`},{type:`code`,lang:`yaml`,code:`# compose.yaml
services:
  api:
    build: .
    ports: ['3000:3000']
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }

  db:
    image: postgres:16
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: secret, POSTGRES_DB: app }
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U app']
      interval: 5s

  cache:
    image: redis:7

volumes:
  pgdata:`},{type:`code`,lang:`bash`,code:`docker build -t acme/api:1.0 .           # build image
docker run -p 3000:3000 --env-file .env acme/api:1.0
docker compose up -d                       # api + postgres + redis
docker compose logs -f api
docker exec -it <container> sh             # shell into a running container`},{type:`flow`,title:`Build once, run anywhere`,code:`flowchart LR
  D[Dockerfile + code]:::client --> B[docker build]:::server
  B --> I["Image<br/>acme/api:sha"]:::highlight
  I --> R[("Registry")]:::db
  R --> L[Laptop]:::external
  R --> CI[CI tests]:::server
  R --> P["Production<br/>K8s / ECS"]:::network`},{type:`bullets`,items:["Node-specific: handle `SIGTERM` for graceful shutdown (Docker sends it on stop), log to stdout/stderr, run as non-root, and use `npm ci` for reproducible installs.",`Keep containers stateless — files written inside a container are lost when it is replaced.`,"Use `.dockerignore` to keep `node_modules`, `.git` and `.env` out of the build context."]},{type:`callout`,variant:`tip`,text:`Interview tip: link Docker to the rest of the pipeline — the same image tested in CI is the one promoted to production, identified by commit SHA. That shows you understand why teams adopt it.`}]},"What is a Dockerfile and how do you write one for Node.js?":{summary:'A Dockerfile is a text recipe of instructions (`FROM`, `WORKDIR`, `COPY`, `RUN`, `CMD`…) that Docker executes to build an image layer by layer. A good Node.js Dockerfile uses an official slim/alpine base, copies `package*.json` first so `npm ci` is cached, uses a multi-stage build to keep dev dependencies and build tools out of the final image, runs as a non-root user and starts with `CMD ["node", "dist/server.js"]`.',details:[{type:`paragraph`,text:"Each instruction creates a cached layer. Docker reuses a layer if nothing it depends on changed — so order instructions from least to most frequently changing. Copying `package.json` before the source means code edits don't trigger a full reinstall."},{type:`heading3`,text:`Production multi-stage Dockerfile (TypeScript app)`},{type:`code`,lang:`dockerfile`,code:`# ---- Stage 1: build ----
FROM node:22-alpine AS build
WORKDIR /app

# Dependency layer \u2014 cached unless package files change
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build            # tsc -> dist/
RUN npm prune --omit=dev     # drop devDependencies

# ---- Stage 2: runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Only what is needed to run
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node                    # non-root user provided by the official image
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1

# Exec form: node is PID 1 and receives SIGTERM directly
CMD ["node", "dist/server.js"]`},{type:`code`,lang:`text`,code:`# .dockerignore
node_modules
dist
.git
.env*
coverage
*.log
Dockerfile`},{type:`heading3`,text:`Why each choice matters`},{type:`bullets`,items:["**Pinned base tag** (`node:22-alpine`, or a digest) for reproducible builds; slim/alpine images are smaller with less attack surface. Alpine uses musl, so some native modules need `node:22-slim` instead.","**`npm ci`** installs exactly what the lockfile says and fails if it is out of sync.",`**Multi-stage** — the final image has no compiler, source or dev dependencies (often hundreds of MB smaller).`,"**`USER node`** — a container breakout as root is much more serious.","**Exec-form `CMD`** — avoid `npm start` or shell form, which wrap Node in another process that may not forward `SIGTERM`, breaking graceful shutdown. Use `--init` or `tini` if you need zombie reaping.","Never `COPY .env` or bake secrets into layers — they stay in image history. Inject them at runtime."]},{type:`callout`,variant:`warning`,text:"Common pitfall: `COPY . .` before `npm ci`. Every code change invalidates the cache and reinstalls all dependencies, making builds slow. Copy the package files first."}]},"What is Kubernetes and what problem does it solve?":{summary:`Kubernetes is a container orchestration platform. You declare the desired state — "run 5 replicas of api:1.4 with these resources, behind this Service" — and it keeps reality matching it: scheduling containers onto machines, restarting failed ones, load balancing, rolling deployments and rollbacks, autoscaling, and managing config and secrets. It solves running many containers reliably across a fleet of servers.`,details:[{type:`paragraph`,text:`Docker alone runs containers on one host. In production you need answers to: which machine runs what, what happens when a container or node dies, how traffic finds healthy instances, how to deploy without downtime, and how to scale with load. Kubernetes automates all of that through **controllers** that continuously reconcile actual state to desired state.`},{type:`heading3`,text:`Core objects`},{type:`bullets`,items:[`**Pod** — smallest unit; one or more containers sharing network and storage.`,`**Deployment** — manages ReplicaSets of pods; handles rolling updates and rollbacks.`,`**Service** — stable virtual IP/DNS name that load-balances across healthy pods.`,`**Ingress / Gateway** — HTTP routing from outside the cluster (host/path rules, TLS).`,`**ConfigMap / Secret** — configuration and sensitive values injected as env vars or files.`,`**HorizontalPodAutoscaler** — scales replicas on CPU, memory or custom metrics.`,`**Probes** — liveness (restart if stuck), readiness (remove from traffic until ready), startup.`]},{type:`code`,lang:`yaml`,code:`apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  strategy:
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }   # zero-downtime deploys
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/api:3f9c2e1
          ports: [{ containerPort: 3000 }]
          envFrom: [{ secretRef: { name: api-secrets } }]
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { memory: 512Mi }
          readinessProbe: { httpGet: { path: /ready, port: 3000 }, periodSeconds: 5 }
          livenessProbe: { httpGet: { path: /health, port: 3000 }, periodSeconds: 10 }
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 3000 }]`},{type:`flow`,title:`Traffic path in a cluster`,code:`flowchart LR
  U[Users]:::client --> IN["Ingress<br/>TLS, routing"]:::network
  IN --> S["Service api<br/>stable DNS"]:::network
  S --> P1[Pod 1]:::server
  S --> P2[Pod 2]:::server
  S --> P3[Pod 3]:::server
  CP["Control plane<br/>reconcile loop"]:::highlight -. "restart, reschedule, scale" .-> P1 & P2 & P3`},{type:`bullets`,items:["For Node: run one process per container (no PM2 cluster needed), scale with replicas, size memory limits with `--max-old-space-size` in mind, and handle `SIGTERM` for graceful shutdown during rollouts.",`Trade-off: Kubernetes is powerful but complex. Managed options (EKS, GKE, AKS) reduce ops burden; small teams may be better served by ECS, Cloud Run or a PaaS.`]},{type:`callout`,variant:`tip`,text:`Interview tip: the key idea is **declarative desired state + reconciliation**. Mention self-healing, rolling updates and autoscaling, and be honest that it adds operational complexity.`}]},"What is a reverse proxy and why is Nginx used with Node.js?":{summary:`A reverse proxy sits in front of your servers and receives client requests on their behalf, forwarding them to backend apps. Nginx is commonly put in front of Node.js to terminate TLS, load-balance across Node instances, serve static files and cache efficiently, compress responses, buffer slow clients, and add rate limiting and security headers — so Node only handles application logic.`,details:[{type:`paragraph`,text:`A **forward** proxy acts for clients (e.g. a corporate proxy). A **reverse** proxy acts for servers: clients only see the proxy's address, never the Node processes behind it.`},{type:`heading3`,text:`Why put Nginx in front of Node`},{type:`bullets`,items:[`**TLS termination** — certificates and HTTP/2 handled in optimized C code.`,`**Load balancing** — round-robin/least-connections across several Node processes or hosts, with passive health checks.`,"**Static files** — Nginx serves images, JS bundles and CSS with `sendfile`, freeing the Node event loop.",`**Slow-client buffering** — Nginx absorbs slow uploads/downloads so a Node worker is not tied up.`,`**Security & limits** — rate limiting, request size limits, IP allow/deny, security headers, hiding internal ports.`,`**Caching and gzip/brotli compression**.`,`Run Node on an unprivileged port (3000) while Nginx listens on 80/443.`]},{type:`code`,lang:`text`,code:`# /etc/nginx/conf.d/api.conf
upstream node_api {
  least_conn;
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;
  keepalive 64;
}

limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

server {
  listen 443 ssl http2;
  server_name api.example.com;
  ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  client_max_body_size 5m;
  gzip on;

  location /static/ {
    root /var/www/app;
    expires 7d;
  }

  location / {
    limit_req zone=api burst=40 nodelay;
    proxy_pass http://node_api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}`},{type:`code`,lang:`javascript`,code:`// Express: trust the proxy so req.ip and req.protocol use X-Forwarded-* headers
app.set('trust proxy', 1); // trust exactly one hop (Nginx)`},{type:`flow`,title:`Request path through Nginx`,code:`flowchart LR
  C[Browser]:::client -->|HTTPS| N["Nginx<br/>TLS, gzip, rate limit"]:::network
  N -->|"/static"| F[("Static files")]:::db
  N -->|"HTTP :3000"| A[Node instance 1]:::server
  N -->|"HTTP :3001"| B[Node instance 2]:::server`},{type:`bullets`,items:['WebSockets need `proxy_set_header Upgrade $http_upgrade;` and `Connection "upgrade"` in that location.',`In Kubernetes or cloud setups, the same role is played by an Ingress controller (often Nginx), Envoy, Traefik or a cloud load balancer.`]},{type:`callout`,variant:`warning`,text:"Common pitfall: forgetting `trust proxy` — every request then appears to come from 127.0.0.1, which breaks rate limiting, logging and secure-cookie detection. Do not set it to `true` blindly either, or clients can spoof `X-Forwarded-For`."}]},"How do you manage environment variables securely in Node.js?":{summary:"Keep configuration and secrets out of source code: read them from `process.env`, load a git-ignored `.env` only in local development (Node 20.6+ supports `--env-file`), validate everything at startup with a schema, and in production inject secrets from a secrets manager (AWS Secrets Manager, Vault, Kubernetes Secrets) — never bake them into images or log them.",details:[{type:`heading3`,text:`Local development`},{type:`code`,lang:`bash`,code:`# .env  (in .gitignore \u2014 never committed)
DATABASE_URL=postgres://app:secret@localhost:5432/app
JWT_SECRET=dev-only-secret
PORT=3000

# .env.example  (committed \u2014 documents required keys, no real values)
DATABASE_URL=
JWT_SECRET=
PORT=3000

# Node 20.6+: built-in loader, no dotenv needed
node --env-file=.env server.js`},{type:`heading3`,text:`Validate once, export a typed config`},{type:`code`,lang:`typescript`,code:`// config.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Log WHICH keys are wrong, never their values
  console.error('Invalid config:', parsed.error.flatten().fieldErrors);
  process.exit(1); // fail fast at boot, not at 3am on first use
}

export const config = Object.freeze(parsed.data);
// Elsewhere: import { config } from './config'; config.PORT is a number`},{type:`heading3`,text:`Production`},{type:`bullets`,items:[`**Secrets manager** — AWS Secrets Manager/SSM Parameter Store, GCP Secret Manager, Azure Key Vault or HashiCorp Vault, with access controlled by IAM roles and audited.`,`**Kubernetes** — Secrets mounted as env vars or files; enable encryption at rest and RBAC, or sync from a manager with External Secrets Operator.`,`**CI/CD** — use the platform's encrypted secrets (GitHub Actions secrets/environments); they are masked in logs.`,`**Rotation** — prefer short-lived credentials (IAM roles, dynamic DB credentials) and rotate static secrets regularly.`,`**Least privilege** — each service gets only the secrets it needs.`]},{type:`bullets`,items:["Never commit `.env`; add secret scanning (gitleaks, GitHub secret scanning) to catch mistakes. A leaked secret must be **rotated**, not just deleted from git history.","Never `COPY .env` into a Docker image or pass secrets as build args — they persist in image layers.","Do not log `process.env` or full config objects; redact secrets in logger config (e.g. pino `redact`).",`Frontend bundles cannot keep secrets — anything shipped to the browser is public.`]},{type:`callout`,variant:`tip`,text:"Interview tip: the three points that impress are **validation at startup**, **a secrets manager in production**, and **rotation after a leak**. Mentioning `--env-file` shows you are current with Node."}]},"What are health checks and how do you implement them in Node.js?":{summary:"Health checks are endpoints or commands that orchestrators and load balancers call to decide whether an instance is alive and able to take traffic. Implement a cheap liveness endpoint (`/health` or `/livez`: is the process responsive?) and a readiness endpoint (`/ready`: are DB, cache and other critical dependencies reachable?), and flip readiness to failing during graceful shutdown.",details:[{type:`paragraph`,text:`The distinction matters. **Liveness** failing means "this process is broken, restart it". **Readiness** failing means "don't send me traffic right now" \u2014 e.g. still warming up, the database is down, or the pod is shutting down. Mixing them up causes restart storms: if liveness checks the database and the DB blips, Kubernetes restarts every pod at once.`},{type:`code`,lang:`typescript`,code:`import express from 'express';
const app = express();
let shuttingDown = false;

// Liveness: process + event loop responsive. No dependency checks.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Readiness: can we actually serve requests?
app.get('/ready', async (_req, res) => {
  if (shuttingDown) return res.status(503).json({ status: 'shutting_down' });

  const checks = await Promise.allSettled([
    withTimeout(db.query('SELECT 1'), 1000),
    withTimeout(redis.ping(), 1000),
  ]);
  const [dbCheck, redisCheck] = checks.map((c) => (c.status === 'fulfilled' ? 'up' : 'down'));
  const ok = dbCheck === 'up' && redisCheck === 'up';

  res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'degraded', db: dbCheck, redis: redisCheck });
});

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

const server = app.listen(3000);

// Graceful shutdown: fail readiness, drain, then exit
process.on('SIGTERM', () => {
  shuttingDown = true;              // load balancer stops routing new requests
  setTimeout(() => {
    server.close(async () => {      // finish in-flight requests
      await db.end();
      process.exit(0);
    });
  }, 5000);                         // give the LB time to notice
});`},{type:`code`,lang:`yaml`,code:`# Kubernetes probes
livenessProbe:
  httpGet: { path: /health, port: 3000 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /ready, port: 3000 }
  periodSeconds: 5
startupProbe:              # slow boot (migrations, cache warm-up)
  httpGet: { path: /health, port: 3000 }
  failureThreshold: 30
  periodSeconds: 2`},{type:`flow`,title:`How probes drive traffic and restarts`,code:`stateDiagram-v2
  [*] --> Starting
  Starting --> Ready: startup and readiness pass
  Ready --> NotReady: readiness fails (DB down)
  NotReady --> Ready: readiness passes
  Ready --> Restarting: liveness fails 3 times
  NotReady --> Restarting: liveness fails 3 times
  Restarting --> Starting
  Ready --> Draining: SIGTERM, readiness 503
  Draining --> [*]: in-flight requests done`},{type:`bullets`,items:[`Keep checks fast and cheap; add timeouts so a hanging dependency doesn't hang the probe.`,`Don't expose internal details publicly — restrict detailed health output or serve it on an internal port.`,"Docker has `HEALTHCHECK`; AWS ALB/ECS and Nginx Plus have their own HTTP health checks.","Libraries: `@godaddy/terminus`, `@nestjs/terminus`, Fastify plugins."]},{type:`callout`,variant:`warning`,text:`Common pitfall: checking downstream dependencies in the liveness probe. A database outage then causes Kubernetes to restart every healthy Node pod, turning a partial outage into a full one.`}]}};export{e as answers};