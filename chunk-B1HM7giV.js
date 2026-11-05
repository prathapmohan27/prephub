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
  Draining --> [*]: in-flight requests done`},{type:`bullets`,items:[`Keep checks fast and cheap; add timeouts so a hanging dependency doesn't hang the probe.`,`Don't expose internal details publicly — restrict detailed health output or serve it on an internal port.`,"Docker has `HEALTHCHECK`; AWS ALB/ECS and Nginx Plus have their own HTTP health checks.","Libraries: `@godaddy/terminus`, `@nestjs/terminus`, Fastify plugins."]},{type:`callout`,variant:`warning`,text:`Common pitfall: checking downstream dependencies in the liveness probe. A database outage then causes Kubernetes to restart every healthy Node pod, turning a partial outage into a full one.`}]},"Blue-green vs canary vs rolling deployments: how do you choose?":{summary:`Rolling replaces instances a few at a time and is the cheap default. Blue-green runs a full second environment and switches all traffic at once, so rollback is an instant switch back, but you pay for double capacity during the cutover. Canary sends a small share of real traffic to the new version and widens it only while error rate and latency stay healthy, which limits the blast radius. All three have old and new code running at the same time, so the database schema and APIs must work with both versions.`,details:[{type:`heading3`,text:`How each one shifts traffic`},{type:`bullets`,items:["**Rolling:** the orchestrator replaces pods/tasks in batches (`maxSurge`, `maxUnavailable`). No extra environment, but rollback is another rolling deploy (minutes), and during the rollout users hit both versions at random.",`**Blue-green:** "green" is deployed and tested next to live "blue", then the load balancer, Service selector or DNS flips 100% of traffic. Rollback means flipping back (seconds) as long as blue is still running. Costs double capacity for the overlap, and the flip exposes everyone at once.`,`**Canary:** 1–5% of traffic (or an internal segment) goes to the new version, then 25%, 50%, 100%. Problems hit few users and rollback just sets the weight back to 0. Needs weighted routing (ALB weighted target groups, a service mesh, an ingress controller) and good metrics per version.`]},{type:`heading3`,text:`Choosing`},{type:`bullets`,items:[`Low-risk change, stateless service, tight budget: **rolling** with solid readiness probes.`,`Need instant, all-or-nothing rollback, or must run a full test suite against the new stack before any user sees it: **blue-green**.`,`High traffic, risky change, good observability: **canary** with automated analysis. With low traffic a 5% canary gets too few requests to tell you anything.`]},{type:`heading3`,text:`Automated canary analysis with Argo Rollouts`},{type:`code`,lang:`yaml`,code:`apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: api }
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - analysis: { templates: [{ templateName: error-rate }] }
        - setWeight: 50
        - pause: { duration: 10m }
  # selector + pod template as in a Deployment
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: error-rate }
spec:
  metrics:
    - name: error-rate
      interval: 1m
      failureLimit: 2
      successCondition: result[0] < 0.01      # < 1% 5xx
      provider:
        prometheus:
          address: http://prometheus:9090
          query: |
            sum(rate(http_requests_total{app="api",version="canary",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{app="api",version="canary"}[5m]))`},{type:`paragraph`,text:`If the analysis fails, the Rollout aborts and traffic goes back to the stable version without a human. Compare the canary against the stable baseline (error rate, p95/p99 latency, saturation), not against a fixed number only. On AWS, ECS supports blue-green through CodeDeploy with linear or canary traffic shifting and CloudWatch alarms that trigger rollback; plain Kubernetes Deployments only do rolling updates natively.`},{type:`heading3`,text:`The constraint everyone forgets: two versions at once`},{type:`bullets`,items:[`**Database:** use expand/contract migrations. Add the new column (nullable), deploy code that writes both, backfill, switch reads, and only drop the old column in a later release (see the zero-downtime migrations answer in the SQL topic).`,`**APIs and messages:** new code must accept old payloads and old code must tolerate new fields, because a queue may hold messages from either version.`,`**Sessions and caches:** cache keys and serialized formats must be readable by both versions, or be versioned.`,`**Blue-green rollback after writes:** if green wrote data in a new format, flipping back to blue must still work. That is why the schema change ships separately, before the code that needs it.`]},{type:`callout`,variant:`warning`,text:`A destructive migration (dropping or renaming a column) in the same release as the code change breaks every strategy: old pods crash during the rollout and rollback becomes impossible. Make migrations backward compatible first.`},{type:`callout`,variant:`tip`,text:`Interview tip: frame the choice as blast radius vs rollback speed vs cost, then say "whatever the strategy, old and new versions overlap, so we make migrations expand/contract and APIs backward compatible." That sentence signals production experience.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you make sure one user does not bounce between versions during a canary? (Sticky routing by header or cookie.)`,`What metrics would make you abort a canary automatically?`,`How do you roll back if the bad version already wrote data?`,`How do feature flags compare to canary releases?`]}]},"How do feature flags help you release safely, and what are the risks?":{summary:`Feature flags separate deploying code from releasing a feature: the code ships turned off and you turn it on at runtime for internal users, a percentage or a customer segment, and turn it off instantly if something breaks. That makes trunk-based development and small, frequent merges possible. The risks are flag debt, untested combinations of flags, and a stale or misconfigured flag changing production behaviour without a deploy.`,details:[{type:`heading3`,text:`What flags give you`},{type:`bullets`,items:["**Deploy is not release:** unfinished work merges to `main` behind a flag that is off, so there are no long-lived feature branches (trunk-based development).",`**Gradual rollout:** on for employees, then 1%, 10%, 50% of users, or for a beta segment. The bucket is a stable hash of the user id so a user does not flip between on and off.`,`**Kill switch:** an operational flag that disables an expensive or broken path (a recommendation widget, a third-party call) in seconds, without a rollback.`,`**Experiments:** A/B tests use the same mechanism with metrics attached.`,`**Entitlements:** plan-based features. These are long-lived and belong in the product model, not mixed with release flags.`]},{type:`heading3`,text:`Vendor-neutral code with OpenFeature`},{type:`paragraph`,text:`OpenFeature is a CNCF standard API for flag evaluation. Your code calls one API and a provider plugs in LaunchDarkly, Unleash, Flagsmith, a cloud service or your own store, so switching vendor does not touch business code.`},{type:`code`,lang:`typescript`,code:`import { OpenFeature } from '@openfeature/server-sdk';

// at startup: OpenFeature.setProvider(new SomeVendorProvider(...));
const flags = OpenFeature.getClient();

async function checkout(user: User, cart: Cart) {
  const useNewPricing = await flags.getBooleanValue(
    'new-pricing-engine',
    false, // safe default if the flag service is down
    { targetingKey: user.id, plan: user.plan, country: user.country },
  );
  return useNewPricing ? newPricing(cart) : legacyPricing(cart);
}`},{type:`paragraph`,text:`The default value matters: if the flag service is unreachable, evaluation falls back to it, so it should be the safe, known-good behaviour. SDKs usually cache flag rules locally so evaluation is in-process and fast.`},{type:`heading3`,text:`The risks and how to manage them`},{type:`bullets`,items:["**Flag debt:** every flag is an `if` with two code paths. Give release flags an owner and an expiry date, create the cleanup ticket when you create the flag, and fail a lint or dashboard check on flags that have been at 100% for weeks.",`**Combinations:** ten flags means many possible states. Test both states of each flag you change, keep flags independent, and avoid nesting flags inside other flags.`,`**Misconfiguration is a production change:** a flag toggle can cause an outage just like a deploy. Require review or approval for production flag changes, keep an audit log, and show flag changes on the same dashboards as deploys.`,`**Stale flags:** an old flag flipped by accident can revive dead code that no longer works with today's data.`,`**Frontend flags leak:** flags evaluated in the browser are visible to users, so never use them to hide unreleased secrets or enforce authorization.`]},{type:`callout`,variant:`warning`,text:`A widely cited example is Knight Capital (2012): reusing an old flag reactivated dead code on one server that had not been updated, and the firm lost around $440 million in under an hour. Remove dead flags and dead code together.`},{type:`callout`,variant:`tip`,text:`Interview tip: distinguish flag types (release, ops/kill switch, experiment, permission) and their lifetimes. Saying "release flags are temporary and we delete them within a sprint or two of reaching 100%" shows you have lived with flag debt.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you keep a user in the same bucket across requests and services?`,`What happens if the flag service is down?`,`How do flags interact with database migrations?`,`Would you build your own flag system or buy one?`]}]},"What is Infrastructure as Code, and how do Terraform and AWS CDK compare?":{summary:`Infrastructure as Code means servers, networks, databases and permissions are defined in version-controlled files and created by a tool, so every environment is reproducible, reviewed in pull requests and free of hand-made console changes. Terraform uses declarative HCL, works across many clouds and tracks what it created in a state file. AWS CDK lets you write TypeScript that synthesises CloudFormation, so it is AWS-focused but gives you real programming-language abstractions.`,details:[{type:`heading3`,text:`Terraform`},{type:`code`,lang:`hcl`,code:`terraform {
  backend "s3" {
    bucket       = "acme-tf-state"
    key          = "api/prod.tfstate"
    region       = "eu-west-1"
    use_lockfile = true   # state locking (older setups use a DynamoDB table)
  }
}

variable "env" { type = string }

resource "aws_s3_bucket" "uploads" {
  bucket = "acme-uploads-\${var.env}"
  tags   = { env = var.env, owner = "platform" }
}

module "api" {
  source        = "./modules/ecs-service"
  name          = "api-\${var.env}"
  desired_count = var.env == "prod" ? 4 : 1
}`},{type:`bullets`,items:["**State file:** maps resources in code to real resource ids. Keep it remote (S3, Terraform Cloud), encrypted, with locking so two `apply` runs cannot corrupt it. It can contain secrets, so restrict access.","**`terraform plan`:** shows the exact create/update/destroy diff. Run it in CI on every PR and post the output as a comment; `apply` only after merge.","**Drift:** `plan` also reveals changes made outside Terraform. A scheduled plan job that alerts on a non-empty diff catches console edits.",`**Modules:** reusable building blocks (a standard ECS service, a VPC) with inputs and outputs.`,`**Providers** exist for AWS, GCP, Azure, Cloudflare, Datadog, GitHub and more, so one tool manages many systems.`,`**OpenTofu** is the open-source fork created after HashiCorp moved Terraform to the Business Source License in 2023; it is largely compatible for most configurations.`]},{type:`heading3`,text:`AWS CDK`},{type:`code`,lang:`typescript`,code:`import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { env: string }) {
    super(scope, id, props);
    // L3 construct: ALB + Fargate service + IAM + logs in a few lines
    new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Api', {
      desiredCount: props.env === 'prod' ? 4 : 1,
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry('acme/api:1.4.2') },
    });
  }
}

const app = new App();
new ApiStack(app, 'api-prod', { env: 'prod' });`},{type:`bullets`,items:["`cdk synth` produces a CloudFormation template; `cdk diff` is the equivalent of `plan`; `cdk deploy` hands the template to CloudFormation.",`State lives in CloudFormation, so there is no state file to manage, and failed deployments roll back automatically. CloudFormation also has drift detection.`,"**Constructs** come in levels: L1 maps 1:1 to CloudFormation, L2 adds sensible defaults, L3 patterns wire several services together. `grant` methods (e.g. `bucket.grantRead(fn)`) generate least-privilege IAM.",`You get loops, types, unit tests (assertions on the synthesised template) and npm packages for shared constructs.`]},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**Style:** Terraform is declarative HCL; CDK is imperative code that produces a declarative template.`,`**Scope:** Terraform for multi-cloud and SaaS providers; CDK when you are AWS-only and the team is strong in TypeScript.`,"**Risk with CDK:** too much cleverness. Abstractions can hide what is actually created, so always review `cdk diff`.",`**Risk with Terraform:** state management, and HCL gets awkward for complex logic.`,`CDK for Terraform (CDKTF) existed as a middle ground but has seen limited adoption; most teams pick one of the two main options.`]},{type:`callout`,variant:`warning`,text:`Watch for resource replacement in the plan. Renaming a resource or changing an immutable property can show as "destroy and create", which for a database means data loss. Use deletion protection and retain policies on stateful resources, and read the plan before applying.`},{type:`callout`,variant:`tip`,text:`Interview tip: mention the workflow, not just the tool: "plan/diff runs on every PR, a reviewer reads it, apply runs from CI with a role, nobody has write access in the console for prod, and a nightly plan alerts on drift."`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["How do you bring an existing hand-made resource under Terraform? (`import`.)",`How do you structure state across environments and teams?`,`How do you handle secrets in IaC?`,`What would make you choose Pulumi instead?`]}]},"How do you build a small, secure production Docker image for Node.js (multi-stage builds, non-root user, scanning)?":{summary:"Build in one stage with all the tools, then copy only the compiled output and production dependencies into a minimal runtime image such as `node:22-slim` or distroless, pinned by digest. Run as a non-root user with `NODE_ENV=production`, make sure SIGTERM reaches Node, keep secrets out of every layer with BuildKit secret mounts, and scan the image (Trivy or Grype) and publish an SBOM in CI so vulnerable images never reach the registry.",details:[{type:`paragraph`,text:`The basic multi-stage Dockerfile is covered in the Dockerfile answer; this one is about hardening and supply chain for a NestJS API.`},{type:`code`,lang:`dockerfile`,code:`# syntax=docker/dockerfile:1
# Pin by digest: the tag can be moved, the digest cannot
FROM node:22-slim@sha256:<digest> AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Private registry token is mounted for this RUN only, never stored in a layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \\
    --mount=type=cache,target=/root/.npm \\
    npm ci

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

# Distroless: no shell, no package manager, runs as non-root by default
FROM gcr.io/distroless/nodejs22-debian12:nonroot
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
EXPOSE 3000
# distroless images already use node as the entrypoint
CMD ["dist/main.js"]`},{type:`code`,lang:`bash`,code:`DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=$HOME/.npmrc -t acme/api:$GIT_SHA .

# fail CI on fixable high/critical CVEs
trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 acme/api:$GIT_SHA

# software bill of materials for audits and future CVE lookups
syft acme/api:$GIT_SHA -o spdx-json > sbom.json`},{type:`heading3`,text:`Each choice and why`},{type:`bullets`,items:["**Base image:** `slim` (Debian, glibc) is a safe default; `alpine` is smaller but uses musl, which can break native modules; **distroless** removes the shell and package manager, so an attacker who gets in has little to work with, and scanners report far fewer CVEs. Debugging then needs an ephemeral debug container (`kubectl debug`).","**Digest pinning:** `node:22-slim@sha256:...` makes builds reproducible. Use Renovate or Dependabot to bump the digest so you still get security patches.","**`npm ci` then `npm prune --omit=dev`:** the final image has no TypeScript, Jest or build tools. Consider `npm ci --ignore-scripts` when you can, since install scripts run arbitrary code.","**Non-root:** `USER node` on official images, or the `nonroot` distroless tag. Add `readOnlyRootFilesystem`, drop all Linux capabilities and `allowPrivilegeEscalation: false` in the Kubernetes `securityContext`.","**`.dockerignore`:** exclude `.git`, `.env*`, `node_modules`, tests and local configs so they never enter the build context.","**Secrets:** `ARG`/`ENV` values and copied files stay in image history (`docker history` shows them). BuildKit `--mount=type=secret` is the right way; runtime secrets come from the orchestrator."]},{type:`heading3`,text:`Signals and PID 1`},{type:`paragraph`,text:"Use the exec form of `CMD` so Node is PID 1 and receives SIGTERM directly; `npm start` or a shell wrapper may not forward it, and the container is SIGKILLed after the grace period, dropping in-flight requests. PID 1 also has no default signal handlers in Linux, so your app must handle SIGTERM itself (NestJS: `app.enableShutdownHooks()`). If the process spawns children, add a tiny init: `docker run --init`, or `tini` as the entrypoint, to forward signals and reap zombies."},{type:`heading3`,text:`HEALTHCHECK vs orchestrator probes`},{type:`paragraph`,text:"Docker `HEALTHCHECK` is used by plain Docker and Compose. Kubernetes ignores it and uses its own probes; ECS uses the task definition health check. Distroless has no `wget` or `curl`, so either rely on orchestrator probes or write the check as a small Node script."},{type:`callout`,variant:`warning`,text:"A secret deleted in a later layer is still in the earlier layer. `COPY .npmrc` then `RUN rm .npmrc` leaks the token to anyone who can pull the image."},{type:`callout`,variant:`tip`,text:`Interview tip: go beyond "multi-stage and non-root". Mention digest pinning with automated updates, a scan gate in CI, an SBOM, and image signing (for example Sigstore cosign) with admission policies that only allow signed images.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you debug a container with no shell?`,`A scan finds a critical CVE in the base image with no fix. What do you do?`,`How do you keep build times fast with these stages?`,`Why might a Node app not shut down gracefully in a container?`]}]},"What are Kubernetes liveness, readiness and startup probes, and how does autoscaling work?":{summary:`Readiness decides whether a pod receives traffic, liveness decides whether Kubernetes restarts it, and startup holds off the other two until a slow-booting app is up. Autoscaling is layered: the Horizontal Pod Autoscaler adds pods based on CPU or custom metrics compared with resource requests, KEDA scales on event sources such as queue depth, and the cluster autoscaler or Karpenter adds nodes when pods cannot be scheduled.`,details:[{type:`paragraph`,text:`The health checks answer covers the endpoints themselves. Here the focus is on configuring probes correctly and on scaling and shutdown behaviour.`},{type:`heading3`,text:`Probes, resources and graceful shutdown`},{type:`code`,lang:`yaml`,code:`spec:
  terminationGracePeriodSeconds: 45
  containers:
    - name: api
      image: acme/api:1.4.2
      resources:
        requests: { cpu: 250m, memory: 384Mi }   # used for scheduling and HPA %
        limits: { memory: 512Mi }                # OOMKilled above this
      env:
        - { name: NODE_OPTIONS, value: '--max-old-space-size=384' }
      startupProbe:            # up to 60s to boot before liveness starts
        httpGet: { path: /livez, port: 3000 }
        periodSeconds: 2
        failureThreshold: 30
      livenessProbe:           # process only: event loop responds
        httpGet: { path: /livez, port: 3000 }
        periodSeconds: 10
        timeoutSeconds: 2
        failureThreshold: 3
      readinessProbe:          # can it serve? DB pool ok, not draining
        httpGet: { path: /readyz, port: 3000 }
        periodSeconds: 5
        failureThreshold: 2
      lifecycle:
        preStop:
          sleep: { seconds: 10 }   # older clusters: exec ["sleep","10"]`},{type:`bullets`,items:[`**Liveness** should only check that the process itself is healthy (event loop not stuck). Checking the database there means a DB outage restarts every pod, adds reconnect storms and turns a partial outage into a full one.`,`**Readiness** can check critical dependencies; a failing pod is removed from Service endpoints but not killed.`,"**Startup** replaces a long `initialDelaySeconds`; once it passes, liveness takes over.",`**Memory limit vs heap:** set the V8 heap below the container limit, or Node gets OOMKilled before GC reacts. CPU limits cause throttling and latency spikes; many teams set CPU requests but no CPU limit.`]},{type:`heading3`,text:`Graceful shutdown sequence`},{type:`numbered`,items:[`Pod is marked terminating; removal from endpoints and load balancers starts in parallel and takes a few seconds to propagate.`,"The `preStop` hook runs (sleep) so traffic stops arriving before the app begins shutting down.",`SIGTERM reaches Node: stop accepting connections, finish in-flight requests, close DB pools and consumers.`,"If still running after `terminationGracePeriodSeconds` (which includes the preStop time), SIGKILL."]},{type:`heading3`,text:`Autoscaling`},{type:`code`,lang:`yaml`,code:`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleDown: { stabilizationWindowSeconds: 300 }   # avoid flapping
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec:
  minAvailable: 2          # node drains/upgrades keep at least 2 pods
  selector: { matchLabels: { app: api } }`},{type:`bullets`,items:["**CPU-based HPA:** utilization is relative to `requests`, so wrong requests mean wrong scaling. Fine for CPU-bound work.",`**Custom metrics:** Node services are often I/O-bound, so CPU stays low while latency climbs. Scale on requests per second per pod or in-flight requests via a metrics adapter (Prometheus Adapter, cloud metrics).`,`**KEDA:** scales workers on queue length (SQS, Kafka lag, RabbitMQ, Redis) and can scale to zero when the queue is empty.`,"**Nodes:** the cluster autoscaler or Karpenter adds nodes for pending pods. Scaling is not instant, so keep some headroom via `minReplicas`.",`**VPA** right-sizes requests; avoid running it in auto mode on the same metric the HPA uses.`,`**PodDisruptionBudget** protects availability during voluntary disruptions (node drains, upgrades), not crashes.`]},{type:`callout`,variant:`warning`,text:`Without the preStop delay, Node may close its server before the load balancer stops sending traffic, producing a burst of 502s on every deploy and scale-down even though the code handles SIGTERM correctly.`},{type:`callout`,variant:`tip`,text:`Interview tip: say why each probe exists in one line ("readiness = traffic, liveness = restart, startup = slow boot") and then volunteer the DB-in-liveness mistake and the preStop/endpoint race. Those two details separate real experience from tutorial knowledge.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Why might the HPA not scale up an I/O-bound Node service?`,`How would you scale a queue consumer to zero?`,`What happens to WebSocket connections when a pod is drained?`,`How do you choose requests and limits for a Node pod?`]}]},"What are SLIs, SLOs and error budgets, and how do they change how a team works?":{summary:`An SLI is a measured indicator of user experience, such as the share of requests that succeed or finish under 300 ms. An SLO is the target for it over a window, such as 99.9% over 30 days, and the error budget is what is left over: 0.1%, about 43 minutes of full downtime in 30 days. Teams alert on how fast the budget is burning rather than on every error, and use the remaining budget to decide between shipping features and reliability work.`,details:[{type:`heading3`,text:`Choosing SLIs`},{type:`bullets`,items:[`**Availability:** good requests / valid requests. Count 5xx and timeouts as bad; usually exclude 4xx caused by the client.`,`**Latency:** share of requests faster than a threshold (e.g. 99% under 400 ms), which is easier to budget than "p99 < 400 ms".`,`Measure as close to the user as practical (load balancer or edge), and pick a few journeys that matter: login, search, checkout. Not every endpoint.`,`For pipelines and queues: freshness (data processed within N minutes) and correctness.`]},{type:`heading3`,text:`The maths`},{type:`code`,lang:`text`,code:`SLO 99.9% over 30 days
budget = 0.1% x 30 days x 24 h x 60 min = 43.2 minutes of full outage
       (or 0.1% of all requests failing, spread over the month)

99.95% -> ~21.6 min    99.99% -> ~4.3 min
burn rate = actual error rate / allowed error rate
burn rate 1  -> budget lasts exactly 30 days
burn rate 14.4 -> 2% of the monthly budget gone in 1 hour`},{type:`heading3`,text:`Multi-window burn-rate alerts`},{type:`paragraph`,text:`Instead of "alert on any 500", page when the budget is burning fast, and open a ticket when it is burning slowly. Requiring both a long and a short window keeps alerts meaningful and makes them stop soon after recovery (this is the approach described in the Google SRE Workbook).`},{type:`code`,lang:`yaml`,code:`# Prometheus: page if 1h AND 5m error ratios both exceed 14.4x budget
- alert: ApiErrorBudgetFastBurn
  expr: |
    (sum(rate(http_requests_total{job="api",code=~"5.."}[1h]))
      / sum(rate(http_requests_total{job="api"}[1h]))) > (14.4 * 0.001)
    and
    (sum(rate(http_requests_total{job="api",code=~"5.."}[5m]))
      / sum(rate(http_requests_total{job="api"}[5m]))) > (14.4 * 0.001)
  labels: { severity: page }
# Similar rule: 6h and 30m windows at 6x -> page; 3d at 1x -> ticket`},{type:`heading3`,text:`How it changes the team`},{type:`bullets`,items:[`**Budget left:** ship faster, run experiments, accept some risk.`,`**Budget spent:** agreed policy kicks in, for example a feature freeze for risky changes, the next sprint goes to reliability fixes from postmortems, and releases need extra review.`,`**Fewer, better pages:** a single 500 at 3 a.m. no longer wakes anyone; a burn that threatens the month does.`,`**Shared language with product:** "this launch can spend 10 minutes of budget" is a negotiable trade-off, not an argument.`,`**SLA vs SLO:** the SLA is the contractual promise with penalties and should be looser than the internal SLO.`]},{type:`callout`,variant:`warning`,text:`Do not set 100% or "as many nines as possible". Each nine costs much more, users cannot tell the difference beyond their own network's reliability, and a target nobody can meet gets ignored. Start from current performance and what users need.`},{type:`callout`,variant:`tip`,text:`Interview tip: do the 43-minute calculation out loud and explain the error budget policy. Interviewers want to hear that the SLO drives decisions (freeze, prioritise reliability), not just a dashboard number. For the AWS alarm side, link it to CloudWatch alarms from the monitoring answer.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you set an SLO for a service that depends on a less reliable third party?`,`Why measure latency as "percent of requests under X" rather than average?`,`Who owns the error budget policy, and what if product disagrees?`,`How do planned maintenance and dependency outages count?`]}]},"What does a good CI/CD pipeline for a full-stack app look like, from pull request to production?":{summary:`On every pull request, run fast checks (lint, type-check, unit tests, build) only for the projects that changed, plus security scans and a preview environment. After merge, build each artifact once, tag it with the commit SHA and promote that same artifact through staging to production. Each deploy runs backward-compatible migrations, a progressive rollout, smoke tests and automatic rollback on failing health metrics, with an approval gate where the business needs one.`,details:[{type:`heading3`,text:`Stages`},{type:`numbered`,items:["**PR checks (target under 10 minutes):** install with cache, lint, `tsc --noEmit`, unit tests, build. In an Nx or Turborepo monorepo, run only affected projects (`nx affected -t lint test build`).","**Security:** dependency audit (`npm audit`, Dependabot/Renovate, Snyk), SAST (CodeQL or Semgrep), secret scanning, and later an image scan with Trivy.",`**Preview environment:** each PR gets a URL for the Angular app (and optionally an ephemeral API with a seeded DB) so reviewers and product can test it.`,`**Integration/e2e:** API tests against real Postgres/Redis in service containers; a small Playwright suite on critical journeys. Keep the big e2e suite off the PR critical path if it is slow.`,`**Build once:** after merge, build the Docker image and the SPA bundle, tag with the SHA, push, sign, and generate an SBOM. Nothing is rebuilt per environment.`,`**Staging:** deploy the same SHA, run migrations, smoke and e2e tests.`,`**Production:** approval if required, migrations (expand/contract), canary or rolling deploy, smoke tests, automated rollback on error rate or latency.`]},{type:`code`,lang:`yaml`,code:`name: pipeline
on:
  pull_request:
  push: { branches: [main] }

concurrency: { group: \${{ github.workflow }}-\${{ github.ref }}, cancel-in-progress: true }

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }            # nx affected needs history
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx nx affected -t lint typecheck test build --base=origin/main

  image:
    if: github.ref == 'refs/heads/main'
    needs: checks
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read }   # OIDC to the cloud, no stored keys
    outputs: { tag: \${{ steps.meta.outputs.tag }} }
    steps:
      - uses: actions/checkout@v4
      - id: meta
        run: echo "tag=\${{ github.sha }}" >> "$GITHUB_OUTPUT"
      - run: docker build -t $REGISTRY/api:\${{ github.sha }} .
      - run: trivy image --exit-code 1 --severity CRITICAL $REGISTRY/api:\${{ github.sha }}
      - run: docker push $REGISTRY/api:\${{ github.sha }}

  deploy-staging:
    needs: image
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh staging \${{ needs.image.outputs.tag }}   # migrate, rollout, smoke

  deploy-prod:
    needs: [image, deploy-staging]
    environment: production        # required reviewers configured on the environment
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh production \${{ needs.image.outputs.tag }}`},{type:`heading3`,text:`Principles behind it`},{type:`bullets`,items:[`**Build once, promote:** what you tested in staging is byte-for-byte what runs in production. Configuration comes from the environment.`,`**Migrations as their own step,** run once per deploy (a job or init task, not on every pod start), and always backward compatible so rollback of the code is safe.`,"**Fast feedback:** caching, parallel jobs, affected-only builds and `concurrency` to cancel outdated runs. A 40-minute PR pipeline gets bypassed.",`**Rollback is a deploy of the previous SHA** (or an aborted canary) and should be one click or automatic. Practise it.`,`**Least privilege:** OIDC federation instead of long-lived cloud keys, environment-scoped secrets, and protected branches.`,"**Frontend:** upload hashed assets first, then `index.html` with no-cache, so the SPA never references files that are not there yet (see the S3/CloudFront answer)."]},{type:`callout`,variant:`warning`,text:"Rebuilding the image per environment (`docker build` in the staging job and again in the prod job) means production runs an artifact that was never tested: dependencies or base images may have changed in between."},{type:`callout`,variant:`tip`,text:`Interview tip: walk through the pipeline in order and name one real failure each stage caught in your projects. Then mention DORA metrics (deployment frequency, lead time, change failure rate, time to restore) as how you measured whether the pipeline was getting better.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you deal with flaky tests in the pipeline?`,`How do you deploy the frontend and backend when they change together?`,`What happens if a migration fails halfway through a deploy?`,`How do you keep secrets out of CI logs and forked PRs?`]}]},"How do you manage configuration across dev, staging and production without drift?":{summary:`Build one artifact and inject everything that differs per environment at runtime (12-factor config). The per-environment values live in version control: in IaC variables, Helm or Kustomize overlays, or parameter stores populated by IaC, never in manual console edits. GitOps tools such as Argo CD or Flux then continuously reconcile the cluster with Git, so any drift is detected and reverted, and secrets come from a secret manager rather than the repo.`,details:[{type:`heading3`,text:`Where drift comes from`},{type:`bullets`,items:[`Someone fixes an incident by editing a setting in the console and never back-ports it.`,'Environment-specific builds (`ng build --configuration=staging`, `if (env === "prod")` code paths) so staging is not really testing production.',`Each environment created by hand at a different time, with different versions and defaults.`,"Config spread across `.env` files, CI variables, parameter stores and code, with nobody sure which wins."]},{type:`heading3`,text:`Practices that prevent it`},{type:`numbered`,items:["**Same artifact everywhere:** one image or bundle per commit; only config differs. For an Angular SPA, load a `config.json` at startup (or inject it at the edge) instead of baking API URLs into separate builds.",`**Config is code:** a base set of values plus small per-environment overlays, reviewed in PRs. The difference between staging and prod is a readable diff.`,`**Validated at startup:** parse config with a schema and fail fast if something is missing or wrong (example below).`,`**Infrastructure from IaC:** the same modules for every environment with different variables (size, replicas), so environments differ in scale, not in shape.`,"**No manual changes:** read-only console access in production, break-glass roles that are audited, and scheduled `terraform plan` or CloudFormation drift detection that alerts on differences.",`**GitOps:** Argo CD or Flux watches a Git repo of manifests, applies it, reports "OutOfSync" when the cluster differs and can self-heal. Promoting to prod is a PR that changes an image tag or value.`]},{type:`code`,lang:`yaml`,code:`# kustomize: base + overlays, one image tag promoted by PR
# base/deployment.yaml has the shape; overlays only change values
# overlays/prod/kustomization.yaml
resources: [../../base]
images:
  - name: acme/api
    newTag: 3f9c2e1            # same SHA that passed staging
replicas:
  - name: api
    count: 6
configMapGenerator:
  - name: api-config
    literals:
      - LOG_LEVEL=info
      - FEATURE_FLAGS_ENV=production`},{type:`code`,lang:`typescript`,code:`import { z } from 'zod';

const Config = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().default(3000),
});

export const config = Config.parse(process.env); // crash on boot, not at 3 a.m.`},{type:`heading3`,text:`Secrets`},{type:`paragraph`,text:`Secrets follow the same rule (same artifact, injected at runtime) but are stored in a secret manager, not in Git: AWS Secrets Manager or Parameter Store (see the AWS secrets answer), Vault, or in GitOps setups External Secrets Operator or Sealed Secrets, which keep only a reference or encrypted value in the repo. IaC creates the secret and its access policy; rotation happens in the secret store.`},{type:`callout`,variant:`warning`,text:`Keep feature flags and runtime config in sync with this process too. A flag or parameter changed by hand in one environment is drift with the same blast radius as a manual infrastructure change.`},{type:`callout`,variant:`tip`,text:`Interview tip: summarise as "one artifact, config as code, Git as the source of truth, and automation that detects or reverts anything else". Then give one concrete drift incident and how the process would have caught it.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you handle an emergency change in production under GitOps?`,`How does an Angular app get environment-specific API URLs without separate builds?`,`How do you keep dev environments realistic without copying production data?`,`Helm vs Kustomize: which would you use for overlays?`]}]}};export{e as answers};