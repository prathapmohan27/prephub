var e={"what-makes-a-rest-api-well-designed":{summary:`A well-designed REST API models the domain as resources (plural nouns in collections), uses HTTP methods and status codes for what they mean, and is boringly consistent: the same casing, envelope, error format, pagination and date format everywhere. Clients should be able to guess the next endpoint correctly. Concurrency (ETag / If-Match) and clear creation semantics (201 + Location) are what separate a senior design from a CRUD dump.`,details:[{type:`paragraph`,text:`Method semantics and PUT vs PATCH are covered in the HTTP APIs answers, and the full status-code ranges in Networking. Here the focus is the design decisions a reviewer looks for.`},{type:`heading3`,text:`Resources and naming`},{type:`bullets`,items:['**Nouns, not verbs:** `POST /orders`, not `POST /createOrder`. Actions that are not CRUD become sub-resources or state changes: `POST /orders/42/cancellation` or `PATCH /orders/42 { "status": "cancelled" }`.',"**Plural collections:** `/orders` and `/orders/42` — never mix `/order/42` and `/users`.","**Shallow nesting:** one level when the child only exists inside the parent (`/orders/42/items`). Beyond that, use top-level resources with filters: `/items?orderId=42` instead of `/customers/7/orders/42/items/3`.","**Consistent casing:** kebab-case paths (`/payment-methods`), one casing for JSON fields (camelCase is natural for a TypeScript stack), ISO 8601 UTC dates, string IDs."]},{type:`heading3`,text:`Status codes per operation`},{type:`bullets`,items:["`GET` → 200 (404 if missing). `POST` create → **201** with a `Location` header and the created resource.","`DELETE` or an update with no body to return → **204**.",`**409 Conflict** for state conflicts (duplicate email, order already shipped); **422** for a well-formed request that fails business validation (many teams use 400 for all validation — pick one and document it).`,"**412 Precondition Failed** when `If-Match` does not match; 428 if you require `If-Match` and it is missing."]},{type:`code`,lang:`http`,code:`POST /v1/orders HTTP/1.1
Content-Type: application/json

{ "customerId": "c_7", "items": [{ "sku": "A1", "qty": 2 }] }

HTTP/1.1 201 Created
Location: /v1/orders/ord_42
ETag: "3"

{ "id": "ord_42", "status": "pending", "createdAt": "2026-11-05T10:00:00Z" }`},{type:`heading3`,text:`Optimistic concurrency with ETag / If-Match`},{type:`paragraph`,text:"Return a version as an `ETag`; clients send it back in `If-Match`. The update only applies if the version still matches, so two editors cannot silently overwrite each other (see the lost-update answer in Backend Operations for the database side)."},{type:`code`,lang:`typescript`,code:`@Patch(':id')
async update(
  @Param('id') id: string,
  @Headers('if-match') ifMatch: string | undefined,
  @Body() dto: UpdateOrderDto,
  @Res({ passthrough: true }) res: Response,
) {
  if (!ifMatch) throw new HttpException('If-Match required', 428);
  const version = Number(ifMatch.replace(/"/g, ''));
  // UPDATE orders SET ..., version = version + 1 WHERE id = $1 AND version = $2
  const order = await this.orders.updateIfVersion(id, version, dto);
  if (!order) throw new HttpException('Order was modified by someone else', 412);
  res.setHeader('ETag', \`"\${order.version}"\`);
  return order;
}`},{type:`heading3`,text:`Consistency`},{type:`bullets`,items:['One list envelope everywhere: `{ "data": [...], "nextCursor": "..." }` (pagination styles are in the Performance answers). Single resources can be returned bare.',`One error format everywhere — ideally RFC 9457 Problem Details.`,`Same query conventions for filtering and sorting on every collection.`,`Write it down in a style guide and enforce it with an OpenAPI linter, not code review memory.`]},{type:`paragraph`,text:"**HATEOAS** (embedding links to next actions) is the purist REST ideal, but few public APIs rely on it and clients rarely navigate by links. A `Location` header and pagination links are usually enough."},{type:`callout`,variant:`tip`,text:`Interview tip: Say "consistency beats cleverness" and then show it — one example request with 201 + Location, one with If-Match and 412, and mention a linted style guide. That is far more convincing than reciting status codes.`},{type:`callout`,variant:`warning`,text:'Do not return 200 with `{ "success": false }`. It breaks caches, monitoring, retries and every HTTP-aware tool between client and server.'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How would you model a non-CRUD action like "approve" or "refund"?`,`400 vs 422 — which do you use for validation errors and why?`,`How do you prevent lost updates without ETags?`,'When would you break the "no verbs" rule (e.g. `POST /search`)?']}]},"evolve-an-api-without-breaking-clients":{summary:"Prefer evolution over versions: make only additive changes, and require clients to be tolerant readers that ignore unknown fields. When a breaking change is unavoidable, introduce a new version (URI, header or media type) alongside the old one, announce deprecation with the `Deprecation` and `Sunset` headers, measure who still calls the old version, and only remove it when telemetry says it is safe. Contract tests and automated breaking-change checks stop accidental breaks before they ship.",details:[{type:`heading3`,text:`Safe vs breaking changes`},{type:`bullets`,items:[`**Safe (additive):** new endpoint, new optional request field, new response field, new optional query parameter, new enum value **only if** clients were told to handle unknown values.`,"**Breaking:** removing or renaming a field, changing a type (`id` number → string), making an optional field required, changing a default, tightening validation, changing status codes or error shape, changing pagination, changing auth or URL structure, changing semantics of an existing field."]},{type:`paragraph`,text:"**Tolerant reader:** clients ignore fields they do not know and do not fail on new enum values. In Angular this means typing responses with only the fields you use and having a default branch for unknown statuses. On the server side, ignore (or explicitly allow) unknown request fields only if that is a documented policy — `whitelist: true` in the NestJS `ValidationPipe` strips them silently."},{type:`heading3`,text:`Versioning strategies`},{type:`bullets`,items:["**URI** (`/v1/orders`): most visible, easy to route, cache and debug. The common default.","**Header** (`Api-Version: 2026-11-01`): cleaner URLs; date-based versions let each client pin the behavior it was built against.",'**Media type** (`Accept: application/vnd.acme.v2+json`): most "RESTful", but hardest for tooling and humans.']},{type:`paragraph`,text:"NestJS supports all three via `enableVersioning` (setup is in the Express & NestJS answers). Whatever you choose, version the **whole API surface** consistently, not individual fields."},{type:`heading3`,text:`Expand, migrate, contract`},{type:`numbered`,items:["Add the new shape next to the old (e.g. return both `name` and `fullName`, or ship `/v2`).",`Update your own clients (the Angular app) and notify external consumers.`,"Mark the old one deprecated in OpenAPI (`deprecated: true`) and in responses.",`Watch usage telemetry per version, endpoint and client ID until it reaches zero (or the sunset date passes).`,`Remove it.`]},{type:`code`,lang:`http`,code:`HTTP/1.1 200 OK
Deprecation: @1798761600
Sunset: Thu, 01 Jul 2027 00:00:00 GMT
Link: <https://api.acme.dev/docs/migrate-v2>; rel="deprecation"`},{type:`code`,lang:`typescript`,code:`// Interceptor that marks a deprecated controller and records who still calls it
@Injectable()
export class DeprecatedInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    res.setHeader('Deprecation', '@1798761600');
    res.setHeader('Sunset', 'Thu, 01 Jul 2027 00:00:00 GMT');
    this.metrics.increment('api.deprecated_call', {
      route: req.route?.path,
      client: req.user?.clientId ?? 'anonymous',
    });
    return next.handle();
  }
}`},{type:`heading3`,text:`Guard rails`},{type:`bullets`,items:["**Breaking-change detection** in CI: diff the OpenAPI spec against `main` (e.g. oasdiff) and fail the build on breaking changes.",`**Consumer-driven contract tests** (e.g. Pact): each consumer publishes what it relies on; the provider verifies against all of them before deploy.`,`**Mobile and cached SPAs** keep old clients alive for months — an Angular tab left open runs yesterday’s bundle against today’s API.`]},{type:`callout`,variant:`tip`,text:`Interview tip: Lead with "the best version is the one you never have to create" — additive changes plus tolerant readers — then describe deprecation with telemetry. Showing you remove versions based on data, not dates alone, signals real production experience.`},{type:`callout`,variant:`warning`,text:"Adding a value to an enum is breaking for clients with exhaustive `switch` statements or strict generated types. Document up front that enums are open-ended."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How long do you support an old version, and who decides?`,`How do you version events or webhooks, not just HTTP endpoints?`,`How do you handle a field rename without a new version?`,`URI vs header versioning: which works better with CDNs and caches?`]}]},"api-errors-with-problem-details":{summary:"Errors should use the correct HTTP status plus one consistent, machine-readable body. RFC 9457 (which obsoletes RFC 7807) standardizes that body as `application/problem+json` with `type`, `title`, `status`, `detail` and `instance`, plus extension members such as field-level validation errors or a trace ID. Clients branch on `type` and `status`, show `detail` to humans, and the server never leaks stack traces or internals.",details:[{type:`heading3`,text:`The members`},{type:`bullets`,items:['`type` — a URI identifying the problem kind (stable; clients switch on it). Defaults to `about:blank`, meaning "just the status code".',"`title` — short, human-readable summary of the type; should not change between occurrences.","`status` — the HTTP status code, repeated for convenience.","`detail` — explanation specific to this occurrence.","`instance` — URI identifying this occurrence (e.g. the request path or an error ID).","**Extension members** — anything else you need: `errors` for fields, `traceId`, `balance`, etc."]},{type:`code`,lang:`http`,code:`HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.acme.dev/problems/validation-error",
  "title": "Your request is not valid.",
  "status": 422,
  "detail": "2 fields failed validation.",
  "instance": "/v1/orders",
  "traceId": "4bf92f3577b34da6",
  "errors": [
    { "pointer": "/email", "detail": "must be a valid email" },
    { "pointer": "/items/0/qty", "detail": "must be at least 1" }
  ]
}`},{type:`heading3`,text:`NestJS: one global filter`},{type:`code`,lang:`typescript`,code:`@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = 500;
    let body: Record<string, unknown> = {
      type: 'about:blank',
      title: 'Internal Server Error',
    };

    if (exception instanceof ProblemException) {
      status = exception.status;
      body = exception.problem; // { type, title, detail, ...extensions }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      body = {
        type: 'about:blank',
        title: HttpStatus[status] ?? 'Error',
        detail: typeof r === 'string' ? r : (r as any).message,
      };
    } else {
      // Unknown error: log everything, return nothing internal
      this.logger.error(exception);
    }

    res
      .status(status)
      .type('application/problem+json')
      .json({ ...body, status, instance: req.originalUrl, traceId: req.id });
  }
}

// main.ts
app.useGlobalFilters(new ProblemDetailsFilter());
app.useGlobalPipes(new ValidationPipe({
  exceptionFactory: (errs) => new ProblemException(422, {
    type: 'https://api.acme.dev/problems/validation-error',
    title: 'Your request is not valid.',
    errors: errs.map((e) => ({
      pointer: '/' + e.property,
      detail: Object.values(e.constraints ?? {}).join(', '),
    })),
  }),
}));`},{type:`heading3`,text:`Angular: read it in one place`},{type:`code`,lang:`typescript`,code:`export interface Problem {
  type: string; title: string; status: number;
  detail?: string; instance?: string; traceId?: string;
  errors?: { pointer: string; detail: string }[];
}

export function toProblem(err: HttpErrorResponse): Problem {
  const body = err.error;
  if (body && typeof body === 'object' && 'title' in body) return body as Problem;
  return { type: 'about:blank', title: err.statusText || 'Network error', status: err.status };
}

// In a form component
this.api.createOrder(dto).subscribe({
  error: (err: HttpErrorResponse) => {
    const p = toProblem(err);
    if (p.type.endsWith('/validation-error')) {
      p.errors?.forEach((e) =>
        this.form.get(e.pointer.slice(1))?.setErrors({ server: e.detail }));
    } else {
      this.toast.error(p.detail ?? p.title, p.traceId);
    }
  },
});`},{type:`paragraph`,text:`Generic handling (401 redirect, toasts for 5xx) belongs in an interceptor — see the HTTP APIs answers on error interceptors. Field mapping stays in the form that owns the controls.`},{type:`callout`,variant:`warning`,text:"Never put stack traces, SQL, internal hostnames or exception class names in `detail`. Log them server-side and return a `traceId` so support can find them."},{type:`callout`,variant:`tip`,text:"Interview tip: Mention that RFC 9457 replaced RFC 7807 and that the key value is the stable `type` URI — clients switch on it instead of parsing English messages. Then show how one global filter and one client helper make every error look the same."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you localize error messages for users?`,"Should the `type` URI resolve to real documentation?",`How do you report multiple errors in one response?`,`How do errors map in GraphQL, where the status is usually 200?`]}]},"openapi-contract-first-vs-code-first":{summary:"OpenAPI is the single source of truth for the API contract. Contract-first means you write and review the spec before code (best for public or cross-team APIs); code-first means the spec is generated from annotated code like NestJS with `@nestjs/swagger` (faster for a single full-stack team). Either way, the spec feeds generated TypeScript clients for Angular, linting with Spectral, breaking-change detection with oasdiff in CI, and mock servers so the frontend can work in parallel.",details:[{type:`heading3`,text:`Contract-first vs code-first`},{type:`bullets`,items:[`**Contract-first:** design the YAML in a pull request, review it with consumers, then implement. Pros: API design discussed before effort is spent, frontend and backend start together. Cons: spec and code can drift unless you validate requests/responses against the spec or generate server stubs.`,`**Code-first:** decorators and DTOs produce the spec. Pros: never out of sync with the code, low friction. Cons: the API design emerges from implementation details; reviewers must look at the generated spec diff, not just the code.`,"A pragmatic middle ground: code-first, but commit the generated `openapi.json` so every PR shows a reviewable contract diff."]},{type:`code`,lang:`typescript`,code:`// Code-first with NestJS
export class CreateOrderDto {
  @ApiProperty({ example: 'c_7' })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  @Post()
  @ApiCreatedResponse({ type: OrderDto })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateOrderDto): Promise<OrderDto> { /* ... */ }
}

// main.ts
const config = new DocumentBuilder().setTitle('Orders API').setVersion('1.0').build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);`},{type:`paragraph`,text:"The `@nestjs/swagger` CLI plugin can infer most `@ApiProperty` metadata from TypeScript types, which removes a lot of decorator noise."},{type:`heading3`,text:`Generated clients for Angular`},{type:`code`,lang:`bash`,code:`# openapi-generator: Angular services + models
npx @openapitools/openapi-generator-cli generate \\
  -i openapi.json -g typescript-angular -o src/app/api

# or orval (config in orval.config.ts, output.client: 'angular')
npx orval`},{type:`paragraph`,text:"Generated services give typed requests and responses, so a renamed backend field becomes a compile error in the Angular app instead of a runtime `undefined`. Treat generated code as build output: regenerate in CI or via a script, never hand-edit it, and wrap it in your own facade services if you want to keep components independent of the generator."},{type:`heading3`,text:`The CI pipeline around the spec`},{type:`numbered`,items:["**Lint** with Spectral (`spectral lint openapi.yaml`) using a team ruleset: plural paths, camelCase properties, every operation has an `operationId`, errors use `application/problem+json`.","**Detect breaking changes** with oasdiff against the spec on `main` (`oasdiff breaking base.yaml head.yaml --fail-on ERR`).",`**Generate the client** and run the Angular type-check, so backend changes that break the frontend fail the PR.`,`**Mock server** from the spec (e.g. Prism, or MSW handlers generated by orval) so the frontend builds against the contract before the backend exists.`,`**Publish docs** (Swagger UI, Redoc) from the same artifact.`]},{type:`callout`,variant:`warning`,text:`A spec is only a contract if something enforces it. Without response validation or contract tests, a code-first spec can claim a field is required while the handler sometimes omits it.`},{type:`callout`,variant:`tip`,text:`Interview tip: Do not argue that one approach is always right. Say which you would pick for a given team (code-first for one full-stack team, contract-first for public or multi-team APIs) and then describe the CI checks — that is where the real value is.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you keep generated client code out of merge conflicts?`,`How do you share DTO types in an Nx monorepo without OpenAPI?`,`What do you put in a Spectral ruleset?`,"How do you document polymorphic payloads (`oneOf` with a discriminator)?"]}]},"design-and-secure-webhooks":{summary:`A webhook is an HTTP POST from the provider to a URL the consumer registers. Secure it with an HMAC signature over a timestamp plus the raw body, verified with a constant-time comparison and a short tolerance window to block replays. The receiver acknowledges with 2xx quickly and processes asynchronously; the sender retries with exponential backoff, so receivers must be idempotent by event ID and must not assume ordering.`,details:[{type:`heading3`,text:`Payload and headers`},{type:`code`,lang:`http`,code:`POST /webhooks/acme HTTP/1.1
Content-Type: application/json
Webhook-Id: evt_01JC8Z3
Webhook-Timestamp: 1793869200
Webhook-Signature: v1=5d41402abc4b2a76b9719d911017c592...

{ "id": "evt_01JC8Z3", "type": "invoice.paid", "createdAt": "2026-11-05T10:00:00Z",
  "data": { "invoiceId": "inv_9", "version": 4 } }`},{type:`paragraph`,text:'Keep events small and versioned (`type` plus a schema version). Many providers send a "thin" event and let the receiver fetch the current resource, which also sidesteps ordering problems.'},{type:`heading3`,text:`Verifying in Node.js / NestJS`},{type:`code`,lang:`typescript`,code:`import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 300;

export function verifyWebhook(rawBody: Buffer, headers: Record<string, string>, secrets: string[]) {
  const ts = Number(headers['webhook-timestamp']);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false; // replay window

  const received = Buffer.from((headers['webhook-signature'] ?? '').replace(/^v1=/, ''), 'hex');
  const signed = \`\${headers['webhook-id']}.\${ts}.\${rawBody.toString('utf8')}\`;

  // Accept current and previous secret during rotation
  return secrets.some((secret) => {
    const expected = createHmac('sha256', secret).update(signed).digest();
    return expected.length === received.length && timingSafeEqual(expected, received);
  });
}

// main.ts: keep the exact bytes, re-serialized JSON would change the signature
const app = await NestFactory.create(AppModule, { rawBody: true });

@Post('webhooks/acme')
@HttpCode(200)
async receive(@Req() req: RawBodyRequest<Request>, @Headers() headers: Record<string, string>) {
  if (!verifyWebhook(req.rawBody!, headers, this.config.webhookSecrets)) {
    throw new UnauthorizedException();
  }
  const event = JSON.parse(req.rawBody!.toString('utf8'));
  // Idempotent: insert-if-absent on the event id, then hand off
  const isNew = await this.inbox.insertIfAbsent(event.id, event);
  if (isNew) await this.queue.add('webhook', { eventId: event.id });
  return { received: true };
}`},{type:`bullets`,items:["`timingSafeEqual` throws if lengths differ, so check length first; a plain `===` leaks timing information.",`Including the timestamp in the signed string means an attacker cannot replay an old body with a fresh timestamp.`,'Sign the **raw bytes**. With Express, use `express.raw({ type: "application/json" })` on the webhook route only.']},{type:`heading3`,text:`Sender responsibilities`},{type:`bullets`,items:[`Persist events in an outbox and deliver from a worker, not inside the user request.`,`Retry non-2xx and timeouts with exponential backoff and jitter over hours or days; then mark the endpoint failing, alert the customer and offer manual replay.`,`Short delivery timeouts (a few seconds) — slow receivers must not tie up your workers.`,`Secret rotation: allow two active secrets per endpoint (sign with the new one; receivers accept both) for a transition period.`,`Block SSRF: validate registered URLs, refuse private IP ranges, require HTTPS.`]},{type:`heading3`,text:`Receiver responsibilities`},{type:`bullets`,items:[`**Ack fast:** verify, store, enqueue, return 2xx. Do the slow work in a job.`,"**Idempotent by event ID:** delivery is at-least-once, so duplicates are normal. A unique constraint on `event_id` is the simplest guard (same idea as idempotency keys for payments in Backend Operations).","**No ordering assumptions:** `invoice.paid` can arrive before `invoice.created`. Use a version or timestamp on the resource and ignore stale updates, or re-fetch the resource."]},{type:`callout`,variant:`warning`,text:`Parsing JSON with a global body parser before verification is the classic bug: the re-serialized body no longer matches the signature, so teams "fix" it by disabling verification.`},{type:`callout`,variant:`tip`,text:`Interview tip: Cover both sides — what the sender guarantees (signatures, at-least-once, retries) and what the receiver must do (verify raw body, ack fast, dedupe, tolerate reordering). Most candidates only describe one side.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Why HMAC instead of a shared secret in a header? When would you use mTLS or asymmetric signatures?`,`How do you let customers replay missed events?`,`How do you test webhooks locally?`,`How would you rotate a leaked webhook secret without downtime?`]}]},"graphql-n-plus-1-dataloader":{summary:"Because GraphQL resolves each field independently, a query for 50 posts with their authors runs 1 query for the posts and then 50 separate author lookups — N+1. DataLoader collects all `load(id)` calls made in the same tick of the event loop into one batched query (`WHERE id IN (...)`) and caches results for the rest of the request. Loaders must be created per request so the cache never leaks data between users.",details:[{type:`heading3`,text:`How the problem appears`},{type:`code`,lang:`graphql`,code:`query {
  posts(first: 50) {
    title
    author { name }   # resolved once per post
  }
}`},{type:`code`,lang:`typescript`,code:`// Naive resolver: 1 query for posts + 50 queries for authors
@ResolveField(() => User)
author(@Parent() post: Post) {
  return this.users.findById(post.authorId); // SELECT * FROM users WHERE id = $1  (x50)
}`},{type:`heading3`,text:`DataLoader: batch + per-request cache`},{type:`code`,lang:`typescript`,code:`import DataLoader from 'dataloader';

export function createLoaders(users: UsersRepository) {
  return {
    userById: new DataLoader<string, User | null>(async (ids) => {
      const rows = await users.findByIds([...ids]); // SELECT ... WHERE id = ANY($1)
      const byId = new Map(rows.map((u) => [u.id, u]));
      // Must return results in the SAME order and length as ids
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}

// NestJS GraphQL: a new set of loaders for every request
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  inject: [UsersRepository],
  useFactory: (users: UsersRepository) => ({
    autoSchemaFile: true,
    context: ({ req }) => ({ req, loaders: createLoaders(users) }),
  }),
});

// Resolver
@ResolveField(() => User)
author(@Parent() post: Post, @Context() ctx: { loaders: Loaders }) {
  return ctx.loaders.userById.load(post.authorId);
}`},{type:`paragraph`,text:"All 50 `load` calls happen synchronously while the `posts` list is resolved, DataLoader schedules one batch function call, and the query count drops from 51 to 2. Duplicate IDs (the same author on many posts) are deduplicated by the cache."},{type:`heading3`,text:`Why loaders must be per request`},{type:`bullets`,items:[`**Security:** results are cached by key. A singleton loader would serve user A’s permission-filtered data to user B.`,`**Staleness:** a long-lived cache never sees updates; DataLoader is not a replacement for Redis.`,`**Memory:** a global cache grows without bound.`]},{type:`heading3`,text:`Protecting a GraphQL API more broadly`},{type:`bullets`,items:["**Depth limits** (e.g. `graphql-depth-limit`) stop `user → posts → author → posts → ...` recursion.","**Complexity / cost limits** (e.g. `graphql-query-complexity`) weight list fields by their `first`/`limit` argument and reject queries over a budget.",`**Pagination** on every list field, with a maximum page size.`,`**Persisted queries:** clients send a hash instead of the query text. Automatic persisted queries mainly save bandwidth; a strict allowlist (only queries registered at build time) also blocks arbitrary queries in production.`]},{type:`callout`,variant:`warning`,text:`The batch function must return an array of the same length and order as the keys. Returning rows in database order silently gives posts the wrong authors.`},{type:`callout`,variant:`tip`,text:`Interview tip: Explain the mechanism (batching within one event-loop tick), then immediately say "per request, never global" and why. Adding depth/complexity limits shows you think about GraphQL in production, not just in a tutorial.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you batch a one-to-many relation (posts by author ID)?`,`How does DataLoader interact with authorization checks?`,`When would a SQL join in the parent resolver beat DataLoader?`,`How do you measure N+1 in production (query count per operation in traces)?`]}]},"backend-for-frontend-bff-pattern":{summary:`A BFF is a thin server built for one client experience — for example one for the Angular web app and one for mobile — that aggregates calls to downstream services and shapes payloads exactly for that UI. It is usually owned by the frontend team, and it is also the cleanest place to keep OAuth tokens out of the browser. It is worth it when clients have genuinely different needs or the UI makes many chatty calls; the cost is another service to run, and business logic must stay in the domain services.`,details:[{type:`heading3`,text:`What a BFF does`},{type:`bullets`,items:[`**Aggregation:** one dashboard request fans out to orders, profile and recommendations in parallel instead of the browser making three round trips.`,`**Shaping:** returns only the fields the screen needs, in the shape it needs (formatted, flattened, localized), so mobile gets a small payload.`,`**Protocol translation:** the client speaks JSON over HTTP; downstream can be gRPC, queues or legacy SOAP.`,"**Auth:** the BFF runs the OAuth code flow server-side, stores tokens, and gives the browser only an `HttpOnly`, `SameSite` session cookie. Details are in the advanced auth topic (where an Angular SPA should keep tokens)."]},{type:`code`,lang:`typescript`,code:`// NestJS BFF endpoint tailored to the Angular dashboard
@Get('dashboard')
async dashboard(@Session() session: UserSession): Promise<DashboardVm> {
  const token = session.accessToken; // never sent to the browser
  const [profile, orders, recs] = await Promise.allSettled([
    this.profileApi.get(session.userId, token),
    this.ordersApi.list({ userId: session.userId, limit: 5 }, token),
    this.recsApi.forUser(session.userId, token),
  ]);

  return {
    greeting: profile.status === 'fulfilled' ? \`Hi, \${profile.value.firstName}\` : 'Hi',
    recentOrders: orders.status === 'fulfilled'
      ? orders.value.data.map((o) => ({ id: o.id, total: o.totalFormatted, status: o.status }))
      : [],
    // Degrade gracefully: recommendations are optional
    recommendations: recs.status === 'fulfilled' ? recs.value.slice(0, 4) : [],
  };
}`},{type:`paragraph`,text:`On the Angular side, the component now makes a single call that returns a view model, which simplifies state handling and loading states considerably.`},{type:`heading3`,text:`When it is worth it`},{type:`bullets`,items:[`Several clients (web, mobile, partner) with different data needs pulling a general-purpose API in different directions.`,`A microservice backend where the UI would otherwise orchestrate many calls.`,`You want token-free browsers for security reasons.`,`The frontend team wants to ship UI changes without waiting on a backend team for each payload tweak.`]},{type:`heading3`,text:`When it is not`},{type:`bullets`,items:[`One client and one monolith API: the API already is the BFF.`,`A small team without capacity to own another deployable, its on-call and its latency budget.`,`GraphQL already gives clients flexible shaping (though a GraphQL gateway can itself act as a BFF).`]},{type:`callout`,variant:`warning`,text:`The main failure mode is business logic creeping into BFFs — pricing rules or permission checks duplicated in the web BFF and the mobile BFF, drifting apart. A BFF composes and shapes; decisions live in domain services.`},{type:`callout`,variant:`tip`,text:`Interview tip: Frame it as "one backend per experience, owned by the team that owns the experience", give the auth benefit, then name the costs (extra hop, extra service, duplication risk). Balanced trade-offs are what senior interviewers listen for.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`BFF vs API gateway: what is the difference?`,`How do you handle partial failure of a downstream service in the BFF?`,`Would you use Angular SSR as the BFF?`,`How do you avoid the BFF becoming a latency bottleneck?`]}]},"filtering-sorting-and-field-selection":{summary:"Use a small, consistent query-string convention on every collection — for example `?status=active&createdAfter=2026-01-01&sort=-createdAt,name&fields=id,name` — and parse it into a validated object. Only whitelisted fields can be filtered or sorted, and they map to real columns through a lookup table, which both prevents SQL injection through `ORDER BY` and keeps queries on indexed paths. Document the parameters in OpenAPI and combine with cursor pagination.",details:[{type:`heading3`,text:`A convention`},{type:`code`,lang:`http`,code:`GET /v1/orders?status=pending,paid&customerId=c_7&createdAfter=2026-10-01T00:00:00Z
              &sort=-createdAt,id&fields=id,status,total&limit=25&cursor=eyJpZCI6...

HTTP/1.1 200 OK
{ "data": [{ "id": "ord_42", "status": "paid", "total": 4999 }], "nextCursor": "eyJpZCI6..." }`},{type:`bullets`,items:['**Equality filters** as plain params (`status=paid`), comma for "in" (`status=pending,paid`).',"**Ranges** with explicit names (`createdAfter`, `minTotal`) or a bracket syntax (`total[gte]=100`) — pick one and use it everywhere.","**Sort** as a comma list with `-` for descending; always append a unique tie-breaker (`id`) so pagination is stable.","**Field selection** (`fields=`) trims payloads for mobile or large tables; `id` is always included.","Complex search (nested boolean logic, full text) is often better as `POST /orders/search` with a JSON body, or a search engine."]},{type:`heading3`,text:`Whitelisting and safe query building`},{type:`code`,lang:`typescript`,code:`const SORTABLE = { createdAt: 'o.created_at', total: 'o.total_cents', id: 'o.id' } as const;
const SELECTABLE = { id: 'o.id', status: 'o.status', total: 'o.total_cents', createdAt: 'o.created_at' } as const;

export class ListOrdersQuery {
  @IsOptional() @IsIn(['pending', 'paid', 'shipped'], { each: true })
  @Transform(({ value }) => String(value).split(','))
  status?: string[];

  @IsOptional() @IsISO8601() createdAfter?: string;

  @IsOptional() @Matches(/^-?\\w+(,-?\\w+)*$/) sort = '-createdAt';
  @IsOptional() fields?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit = 25;
}

function buildOrderBy(sort: string) {
  const parts = sort.split(',').map((s) => {
    const desc = s.startsWith('-');
    const key = desc ? s.slice(1) : s;
    const column = SORTABLE[key as keyof typeof SORTABLE];
    if (!column) throw new BadRequestException(\`Cannot sort by "\${key}"\`);
    return { column, direction: desc ? 'DESC' : 'ASC' };
  });
  if (!parts.some((p) => p.column === SORTABLE.id)) parts.push({ column: SORTABLE.id, direction: 'ASC' });
  return parts; // column names come from our map, never from the request
}`},{type:`paragraph`,text:"Filter **values** go through parameter binding as usual. The danger is identifiers: `ORDER BY` columns and directions cannot be bound as parameters, so concatenating `req.query.sort` into SQL is a real injection vector. A map from public name to column solves it and also decouples the API from the schema."},{type:`heading3`,text:`Index-friendly filters`},{type:`bullets`,items:["Only expose filters and sorts you can serve with an index (e.g. composite `(customer_id, created_at DESC, id)`). An arbitrary-sort API is a promise of full table scans.",'Avoid leading-wildcard `LIKE "%term%"` on big tables; use full-text or trigram indexes, or a search service.',"Cursor pagination (see Performance answers) depends on a deterministic sort — another reason for the `id` tie-breaker.","Cap `limit` and reject unknown parameters, so typos like `?stauts=paid` do not silently return everything."]},{type:`heading3`,text:`Documenting it`},{type:`paragraph`,text:'Declare every parameter in OpenAPI with an `enum` of allowed sort and filter fields (`@ApiQuery({ name: "sort", enum: [...] })` or via the DTO with `@ApiPropertyOptional`). Generated Angular clients then get typed parameters and the convention is lintable.'},{type:`callout`,variant:`warning`,text:"Field selection affects caching and authorization: cache keys must include `fields`, and you must still apply field-level permissions — `fields=passwordHash` must never work."},{type:`callout`,variant:`tip`,text:`Interview tip: The two words that make this answer senior are "whitelist" and "index". Show the map from public field to column, then explain that you only offer the filters your indexes can serve.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you support OR conditions or nested filters?`,`How do you sync filters with the Angular router query params?`,`When would you move search to Elasticsearch or OpenSearch?`,`How does field selection compare to GraphQL?`]}]},"long-running-operations-202-accepted":{summary:"When work takes longer than a normal request timeout (reports, video processing, bulk imports), accept the request, enqueue a job and return `202 Accepted` with a `Location` header pointing to a status resource. Clients poll that resource (guided by `Retry-After`) or get notified by webhook or SSE when it completes. Job creation should be idempotent, jobs should support cancellation, and the final status links to the result.",details:[{type:`heading3`,text:`The flow`},{type:`code`,lang:`http`,code:`POST /v1/reports HTTP/1.1
Idempotency-Key: 6f1c9a2e-...
{ "type": "sales", "from": "2026-01-01", "to": "2026-10-31" }

HTTP/1.1 202 Accepted
Location: /v1/jobs/job_81
Retry-After: 5
{ "id": "job_81", "status": "queued" }

GET /v1/jobs/job_81
HTTP/1.1 200 OK
Retry-After: 5
{ "id": "job_81", "status": "running", "progress": 0.4 }

GET /v1/jobs/job_81
HTTP/1.1 200 OK
{ "id": "job_81", "status": "succeeded", "resultUrl": "/v1/reports/rep_33" }`},{type:`bullets`,items:["Status values: `queued`, `running`, `succeeded`, `failed` (with a Problem Details error), `cancelled`.",`Polling the job returns **200** with its current state; the job resource itself exists, even if the work failed.`,"Some APIs answer the finished job with `303 See Other` to the result; returning a `resultUrl` field is simpler for SPA clients.","Cancellation: `DELETE /v1/jobs/job_81` or `POST /v1/jobs/job_81/cancel`; the worker checks a cancel flag between steps."]},{type:`heading3`,text:`NestJS with a queue`},{type:`code`,lang:`typescript`,code:`@Post('reports')
@HttpCode(202)
async create(
  @Body() dto: CreateReportDto,
  @Headers('idempotency-key') key: string,
  @Req() req: AuthedRequest,
  @Res({ passthrough: true }) res: Response,
) {
  // Same key + same user returns the existing job instead of starting another
  const job = await this.jobs.findOrCreate(req.user.id, key, () =>
    this.queue.add('report', { ...dto, userId: req.user.id }),
  );
  res.setHeader('Location', \`/v1/jobs/\${job.id}\`);
  res.setHeader('Retry-After', '5');
  return { id: job.id, status: job.status };
}`},{type:`paragraph`,text:"Persist job state in a database (not only in the queue) so status survives queue cleanup and can be authorized per user. Workers update `progress` and the final status, and emit a completion event."},{type:`heading3`,text:`Notification options`},{type:`bullets`,items:["**Polling:** simplest and works everywhere; respect `Retry-After` and back off.",`**Webhooks:** best for server-to-server consumers; the client registers a callback URL (secured as in the webhooks answer).`,"**SSE or WebSockets:** best for a browser waiting on screen; push `progress` and `done` events (see SSE in Networking)."]},{type:`heading3`,text:`Angular: polling with RxJS`},{type:`code`,lang:`typescript`,code:`startReport(dto: CreateReportDto): Observable<Job> {
  return this.http.post<Job>('/v1/reports', dto, {
    observe: 'response',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  }).pipe(
    switchMap((res) => this.pollJob(res.headers.get('Location')!)),
  );
}

private pollJob(url: string): Observable<Job> {
  return timer(0, 3000).pipe(
    switchMap(() => this.http.get<Job>(url)),
    takeWhile((job) => job.status === 'queued' || job.status === 'running', true),
    timeout({ first: 10 * 60_000 }),
  );
}

// Component: this.job$ = this.api.startReport(dto); cancel by unsubscribing
// (the async pipe does it on destroy), and call DELETE on the job if the user clicks Cancel.`},{type:`paragraph`,text:"With signals, an `httpResource` for the job URL plus a timer that calls `reload()` while the status is not final achieves the same; switch to SSE if many users poll at once."},{type:`callout`,variant:`warning`,text:"Without an idempotency key, a double-click or a retried POST after a gateway timeout starts two expensive jobs. Also always authorize `GET /jobs/:id` — job IDs in URLs get shared and guessed."},{type:`callout`,variant:`tip`,text:"Interview tip: Draw the three-step contract first (202 + Location, status resource, result link), then add idempotency, cancellation and the notification choice. Mentioning `Retry-After` shows you have designed the client side too."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How long do you keep finished jobs and their results?`,`How do you report partial success in a bulk import?`,`What happens if the worker crashes mid-job?`,`How do you let the user leave the page and come back to the job?`]}]}};export{e as answers};