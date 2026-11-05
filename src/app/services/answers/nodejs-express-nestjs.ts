import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'How does Express middleware work?': {
    summary:
      'Middleware are functions `(req, res, next)` that Express runs in the order they were registered. Each one can read or modify `req`/`res`, end the response, or call `next()` to pass control to the next matching middleware; calling `next(err)` skips to the error-handling middleware, which has four arguments `(err, req, res, next)`.',
    details: [
      {
        type: 'paragraph',
        text: 'An Express app is essentially an ordered list (a stack) of middleware and route handlers. For each request, Express walks that list, running only the entries whose path and method match. Nothing magic happens between them — if a middleware neither sends a response nor calls `next()`, the request simply hangs.',
      },
      { type: 'heading3', text: 'Order of execution' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import express from 'express';
const app = express();

// 1. Application-level: runs for every request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(req.method, req.url, res.statusCode, Date.now() - start, 'ms'));
  next(); // hand off to the next middleware
});

// 2. Built-in middleware
app.use(express.json()); // parses JSON body into req.body

// 3. Path-scoped middleware
app.use('/admin', requireAdmin);

// 4. Route handler (also middleware — usually ends the response)
app.get('/users/:id', async (req, res) => {
  res.json(await userService.find(req.params.id));
});

// 5. 404 — nothing matched above
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 6. Error handler — 4 arguments, registered LAST
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message });
});`,
      },
      {
        type: 'flow',
        title: 'Request through the middleware stack',
        code: `flowchart LR
  REQ["Request"]:::client --> L["logger"]:::server
  L -->|"next()"| J["express.json()"]:::server
  J -->|"next()"| A["auth"]:::security
  A -->|"next()"| H["route handler"]:::highlight
  A -->|"next(err)"| E["error handler<br/>(err, req, res, next)"]:::external
  H -->|"res.json()"| RES["Response"]:::client
  H -->|"throw / next(err)"| E
  E --> RES`,
      },
      { type: 'heading3', text: 'Writing a reusable middleware' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import type { Request, Response, NextFunction } from 'express';

// Factory pattern: configure, then return the middleware
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!req.user.roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

app.delete('/users/:id', requireRole('admin'), deleteUser); // route-level middleware`,
      },
      { type: 'heading3', text: 'Types of middleware' },
      {
        type: 'bullets',
        items: [
          '**Application-level** — `app.use()` / `app.METHOD()`.',
          "**Router-level** — `express.Router()` with its own `router.use()`, mounted with `app.use('/api', router)`.",
          '**Built-in** — `express.json()`, `express.urlencoded()`, `express.static()`.',
          '**Third-party** — `helmet`, `cors`, `compression`, `morgan`, `express-rate-limit`.',
          '**Error-handling** — exactly four parameters; Express identifies it by `fn.length === 4`.',
          "`next('route')` skips the remaining handlers of the current route; `next('router')` exits the current router.",
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Async errors: Express 4 does not catch rejected promises — an `async` handler that throws leaves the request hanging (and logs an unhandled rejection) unless you `try/catch` and call `next(err)`. Express 5 forwards rejected promises from handlers to the error middleware automatically. Also remember to call `next()` OR send a response — never both.',
      },
    ],
  },

  'What is the difference between app.use() and app.get() in Express?': {
    summary:
      '`app.use(path, fn)` mounts middleware for **every HTTP method** and matches the path as a **prefix** (`/api` matches `/api/users`), stripping that prefix from `req.url` for the handler. `app.get(path, fn)` registers a route handler only for **GET** (and HEAD) requests and matches the path **exactly** (with route params like `/users/:id`).',
    details: [
      {
        type: 'paragraph',
        text: 'Both add functions to the same ordered stack, but they answer different questions: `use` is "run this for anything under this path" (cross-cutting concerns, mounting routers), while `get`/`post`/`put`/`delete` are "handle this specific endpoint".',
      },
      { type: 'heading3', text: 'Matching behaviour side by side' },
      {
        type: 'code',
        lang: 'javascript',
        code: `app.use('/api', (req, res, next) => {
  console.log('use:', req.method, req.originalUrl, '→ req.url =', req.url);
  next();
});

app.get('/api', (req, res) => res.send('exact GET /api'));

// GET    /api        → use logs (req.url = '/'),        then 'exact GET /api'
// GET    /api/users  → use logs (req.url = '/users'),    then 404 (get doesn't match)
// POST   /api        → use logs,                         then 404 (wrong method)
// DELETE /api/x/y    → use logs (req.url = '/x/y'),      then 404`,
      },
      { type: 'heading3', text: 'Mounting routers is a job for use()' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const users = express.Router();
users.get('/', listUsers);        // GET /api/users
users.get('/:id', getUser);       // GET /api/users/42
users.post('/', createUser);      // POST /api/users

app.use('/api/users', users);     // prefix mount — router sees paths relative to it

// app.all() is the in-between: all methods, but EXACT path matching
app.all('/health', (req, res) => res.sendStatus(200));`,
      },
      {
        type: 'bullets',
        items: [
          '**Methods**: `use` → all; `get` → GET (Express also answers HEAD with it); `all` → all methods.',
          '**Path**: `use` → prefix match, path defaults to `/` (everything); `get` → full match with params, e.g. `/users/:id`.',
          '**`req.url`**: `use` strips the mount path (`req.originalUrl` keeps it); `get` does not.',
          '**Purpose**: `use` for middleware and sub-routers; `get` for endpoint handlers.',
          "`app.get('setting')` with a single string argument is something else entirely — it reads an app setting.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Order still matters for both: a catch-all `app.use((req, res) => res.status(404)...)` placed before your routes will swallow them. Register middleware first, routes next, then 404 and error handlers last.',
      },
    ],
  },

  'What is the difference between Fastify and Express?': {
    summary:
      'Both are minimal Node HTTP frameworks. Express is the older, ubiquitous one with a huge middleware ecosystem and a simple linear middleware model. Fastify is designed for performance and structure: schema-based validation and fast JSON serialization (JSON Schema), a lifecycle of typed hooks, an encapsulated plugin system, built-in logging (Pino), first-class async/await and TypeScript — typically handling noticeably more requests/sec with lower overhead.',
    details: [
      {
        type: 'paragraph',
        text: 'Express (2010) optimised for simplicity: `app.use()` a chain of functions. Fastify (2016) optimised for throughput and maintainability in large apps: route schemas compile into fast validators and serializers, and plugins create isolated scopes so decorators and hooks do not leak across the app. NestJS can run on either via its platform adapters.',
      },
      { type: 'heading3', text: 'Same endpoint in both' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Express
import express from 'express';
const app = express();
app.use(express.json());
app.post('/users', async (req, res, next) => {
  try {
    if (typeof req.body.email !== 'string') return res.status(400).json({ error: 'email required' });
    res.status(201).json(await createUser(req.body));
  } catch (err) { next(err); } // needed in Express 4
});
app.listen(3000);`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Fastify
import Fastify from 'fastify';
const app = Fastify({ logger: true }); // Pino logger built in

app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' }, name: { type: 'string' } },
    },
    response: {
      201: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
    },
  },
}, async (request, reply) => {
  reply.code(201);
  return createUser(request.body); // returned value is serialized; thrown errors → error handler
});
// Invalid body → automatic 400 with a validation message
// Response serializer drops any field not in the schema (e.g. passwordHash)

await app.listen({ port: 3000 });`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          "**Performance**: Fastify's own benchmarks show several times Express's requests/sec for trivial routes; in real apps the DB usually dominates, but lower framework overhead still helps.",
          '**Validation & serialization**: Fastify uses JSON Schema (Ajv + fast-json-stringify); Express needs libraries like Joi/Zod/express-validator.',
          '**Middleware vs hooks**: Express has one linear chain; Fastify has lifecycle hooks (`onRequest`, `preHandler`, `onSend`, `onResponse`, `onError`...).',
          '**Plugins & encapsulation**: Fastify `register()` creates scoped contexts; Express middleware is global or per-router.',
          '**Async**: Fastify handlers can just return a value or throw; Express 4 needs manual `next(err)` (Express 5 improved this).',
          '**Logging & TypeScript**: Fastify ships Pino logging and strong types (type providers for Zod/TypeBox); Express relies on add-ons and `@types/express`.',
          '**Ecosystem**: Express is larger and most tutorials target it; Fastify can run Express middleware via `@fastify/express` / `@fastify/middie` as a bridge.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Good answer framing: "For a new high-throughput API I would pick Fastify (or NestJS on the Fastify adapter) for schemas, speed and structure; for an existing codebase or a team that knows Express, Express 5 is perfectly fine — the database is usually the real bottleneck."',
      },
    ],
  },

  'What is NestJS and how does it differ from Express?': {
    summary:
      'NestJS is an opinionated, TypeScript-first framework for building server-side applications. It runs **on top of** an HTTP adapter (Express by default, or Fastify) and adds architecture: modules, dependency injection, decorators for controllers/routes, and a defined request pipeline (middleware → guards → interceptors → pipes → handler → exception filters). Express is an unopinionated minimal library; Nest gives you an Angular-like structure for large teams.',
    details: [
      {
        type: 'paragraph',
        text: 'With Express you decide everything — folder structure, how to share services, how to validate, how to test. That flexibility becomes inconsistency in large codebases. Nest makes those decisions for you, and its DI container makes code easily testable by swapping providers. It also includes first-class support for microservices (TCP, Redis, NATS, Kafka, gRPC transports), WebSockets, GraphQL, CQRS, scheduling and queues.',
      },
      { type: 'heading3', text: 'The same feature in both' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Express — wiring is manual
const router = express.Router();
const usersService = new UsersService(new UsersRepository(db)); // manual DI

router.get('/:id', async (req, res, next) => {
  try {
    const user = await usersService.findOne(Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (e) { next(e); }
});
app.use('/users', router);`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// NestJS — declarative, DI-driven
@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {} // injected
  async findOne(id: number) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(); // → 404 via built-in exception filter
    return user;
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { // pipe converts & validates
    return this.users.findOne(id);                   // return value → JSON
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}`,
      },
      {
        type: 'flow',
        title: 'NestJS request pipeline',
        code: `flowchart LR
  R["Request"]:::client --> M["Middleware"]:::server
  M --> G["Guards<br/>(can activate?)"]:::security
  G --> IB["Interceptors<br/>(before)"]:::highlight
  IB --> P["Pipes<br/>(validate/transform)"]:::server
  P --> H["Controller<br/>handler"]:::db
  H --> IA["Interceptors<br/>(after)"]:::highlight
  IA --> RES["Response"]:::client
  H -.->|"throws"| F["Exception<br/>filters"]:::external
  F -.-> RES`,
      },
      { type: 'heading3', text: 'Main differences' },
      {
        type: 'bullets',
        items: [
          '**Architecture**: Nest enforces modules/controllers/providers; Express has none.',
          '**DI**: Nest has a built-in IoC container (singleton, request and transient scopes); in Express you wire dependencies by hand or add a library.',
          '**Language**: Nest is TypeScript-first with decorators; Express is plain JS with optional types.',
          '**Cross-cutting concerns**: Nest has guards, interceptors, pipes and filters; Express has only middleware.',
          '**Testing**: `Test.createTestingModule()` lets you override providers with mocks.',
          '**Trade-offs**: Nest adds a learning curve, boilerplate and a bit of startup overhead; for a tiny service Express or Fastify alone may be simpler.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Make it clear Nest is not a replacement HTTP server: "Nest uses Express under the hood by default, and I can switch to `@nestjs/platform-fastify` for performance. I still have access to the raw `req`/`res` and can use any Express middleware."',
      },
    ],
  },

  'What are Guards, Interceptors, and Pipes in NestJS?': {
    summary:
      "**Guards** decide whether a request may proceed (`canActivate` → true/false) — used for authentication and authorization. **Pipes** transform and validate the handler's arguments (e.g. `ParseIntPipe`, `ValidationPipe`). **Interceptors** wrap the handler call itself (before and after, via RxJS) for logging, caching, timeouts and response mapping. They run in the order: middleware → guards → interceptors (before) → pipes → handler → interceptors (after) → exception filters on error.",
    details: [
      {
        type: 'paragraph',
        text: 'All three are classes implementing an interface, get dependency injection, and have access to the `ExecutionContext` (which handler and controller are being called, plus metadata from decorators) — something plain Express middleware does not know. Each can be bound globally, per controller or per method.',
      },
      { type: 'heading3', text: 'Guard — "may this request continue?"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;                       // no @Roles → allowed
    const { user } = ctx.switchToHttp().getRequest();
    return required.some((r) => user?.roles?.includes(r)); // false → 403 Forbidden
  }
}

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
remove(@Param('id') id: string) { /* ... */ }`,
      },
      { type: 'heading3', text: 'Pipe — "are the arguments valid / in the right shape?"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(\`Invalid date: \${value}\`);
    return d; // handler receives a Date, not a string
  }
}

@Get('reports')
find(
  @Query('from', ParseDatePipe) from: Date,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) { /* ... */ }`,
      },
      { type: 'heading3', text: 'Interceptor — "wrap the call"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { Observable, map, tap, timeout, catchError, throwError, TimeoutError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();                       // BEFORE the handler
    return next.handle().pipe(                      // handler runs here
      timeout(5000),
      map((data) => ({ data, timestamp: new Date().toISOString() })), // wrap response
      tap(() => console.log(\`\${ctx.getHandler().name} \${Date.now() - start}ms\`)), // AFTER
      catchError((err) =>
        throwError(() => (err instanceof TimeoutError ? new RequestTimeoutException() : err)),
      ),
    );
  }
}`,
      },
      {
        type: 'flow',
        title: 'Where each one runs',
        code: `flowchart LR
  R["Request"]:::client --> MW["Middleware"]:::server
  MW --> G["Guards"]:::security
  G -->|"false"| F403["403 Forbidden"]:::external
  G -->|"true"| I1["Interceptor<br/>before"]:::highlight
  I1 --> P["Pipes"]:::server
  P -->|"invalid"| F400["400 Bad Request"]:::external
  P --> H["Handler"]:::db
  H --> I2["Interceptor<br/>after"]:::highlight
  I2 --> RES["Response"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          '**Guards**: auth (JWT, API keys), roles/permissions, feature flags. Return `boolean | Promise<boolean> | Observable<boolean>`; throw a custom exception for a different status.',
          '**Pipes**: `ValidationPipe` (class-validator DTOs), `ParseIntPipe`, `ParseUUIDPipe`, `ParseEnumPipe`, `DefaultValuePipe`, custom transforms.',
          '**Interceptors**: logging/metrics, response envelopes, caching (`CacheInterceptor`), timeouts, serialization (`ClassSerializerInterceptor`), mapping errors.',
          '**Binding**: `@UseGuards()`, `@UsePipes()`, `@UseInterceptors()` on a method/class, `app.useGlobalX()`, or the `APP_GUARD`/`APP_PIPE`/`APP_INTERCEPTOR` providers (preferred, because they get DI).',
          '**Exception filters** (`@Catch()`) complete the picture: they turn thrown errors into responses.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'A neat one-liner: "Guards answer **whether**, pipes answer **with what data**, interceptors answer **what happens around** the handler." Also note guards run before interceptors — so an auth failure never reaches your logging interceptor\'s "after" logic.',
      },
    ],
  },

  'How do you implement request validation in NestJS using class-validator?': {
    summary:
      'Define a DTO class with `class-validator` decorators (`@IsEmail()`, `@IsString()`, `@Length()`, `@ValidateNested()`...), enable `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true` and `transform: true`, and type the handler parameter as that DTO. Invalid requests are rejected automatically with a 400 and a list of error messages; `class-transformer` converts the plain JSON into a DTO instance with correct types.',
    details: [
      {
        type: 'paragraph',
        text: "Validation in Nest is a pipe. `ValidationPipe` reads the parameter's TypeScript type via emitted decorator metadata, uses `class-transformer` to turn the JSON body into an instance of the DTO class, then runs `class-validator` on it. Because it relies on runtime metadata, the DTO must be a **class**, not an interface or type alias.",
      },
      { type: 'heading3', text: '1. Install and enable globally' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// npm i class-validator class-transformer
// main.ts
import { ValidationPipe } from '@nestjs/common';

const app = await NestFactory.create(AppModule);
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // strip properties without decorators
    forbidNonWhitelisted: true, // ...or reject them with 400 instead
    transform: true,            // plain object → DTO instance, '42' → 42 for typed params
    transformOptions: { enableImplicitConversion: true },
  }),
);`,
      },
      { type: 'heading3', text: '2. Write DTOs' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import {
  IsEmail, IsString, Length, IsOptional, IsInt, Min, Max,
  IsEnum, ValidateNested, IsArray, ArrayMaxSize, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types'; // or @nestjs/swagger

class AddressDto {
  @IsString() street!: string;
  @IsString() @Length(2, 2) country!: string;
}

export enum Role { User = 'user', Admin = 'admin' }

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  password!: string;

  @IsOptional() @IsInt() @Min(13) @Max(120)
  age?: number;

  @IsEnum(Role)
  role: Role = Role.User;

  @ValidateNested({ each: true })
  @Type(() => AddressDto)          // needed so nested objects become AddressDto instances
  @IsArray() @ArrayMaxSize(5)
  addresses: AddressDto[] = [];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {} // all fields optional`,
      },
      { type: 'heading3', text: '3. Use in the controller' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {    // already validated & typed
    return this.users.create(dto);
  }

  @Get()
  list(@Query() query: PaginationDto) {}   // works for query strings too
}

// POST /users { "email": "nope", "password": "short", "isAdmin": true }
// → 400 Bad Request
// {
//   "statusCode": 400,
//   "error": "Bad Request",
//   "message": [
//     "property isAdmin should not exist",
//     "email must be an email",
//     "password must be longer than or equal to 8 characters", ...
//   ]
// }`,
      },
      { type: 'heading3', text: 'Custom validators' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsFutureDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: { message: \`\${propertyName} must be in the future\`, ...options },
      validator: { validate: (v: unknown) => v instanceof Date && v > new Date() },
    });
}`,
      },
      {
        type: 'bullets',
        items: [
          '`whitelist: true` is a security control — it prevents mass assignment (e.g. a client sending `role: "admin"`).',
          'Use `@Type(() => Number)` / `@Type(() => Date)` or implicit conversion for query params, which always arrive as strings.',
          'Validation groups and `@ValidateIf()` handle conditional rules; async DB checks (e.g. "email unique") are better done in the service.',
          'Mapped types — `PartialType`, `PickType`, `OmitType`, `IntersectionType` — reuse rules between create/update DTOs.',
          'Alternative: Zod schemas with a custom pipe (e.g. `nestjs-zod`) if the team prefers schema-first validation.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: nested objects are NOT validated unless you add both `@ValidateNested()` and `@Type(() => NestedDto)`. And using an `interface` as the body type silently disables validation, because interfaces do not exist at runtime.',
      },
    ],
  },

  'How do you implement JWT authentication in NestJS?': {
    summary:
      "Use `@nestjs/jwt` to sign tokens at login (after verifying the password hash) and a guard to verify them on each request — either a custom `CanActivate` guard calling `jwtService.verifyAsync()`, or Passport (`@nestjs/passport` + `passport-jwt`) with a `JwtStrategy` and `AuthGuard('jwt')`. Register the guard globally via `APP_GUARD`, mark open routes with a `@Public()` decorator, keep access tokens short-lived and use refresh tokens for renewal.",
    details: [
      {
        type: 'paragraph',
        text: 'The flow: client posts credentials → `AuthService` validates the user and signs a JWT containing a minimal payload (`sub`, roles) → client sends it as `Authorization: Bearer <token>` → a guard verifies signature and expiry and attaches the payload to `request.user` → controllers read it via a custom `@CurrentUser()` decorator.',
      },
      { type: 'heading3', text: '1. Module setup' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// npm i @nestjs/jwt bcrypt
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),   // or privateKey/publicKey for RS256
        signOptions: { expiresIn: '15m', issuer: 'api.example.com' },
      }),
    }),
  ],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }], // protect everything
  controllers: [AuthController],
})
export class AuthModule {}`,
      },
      { type: 'heading3', text: '2. Login: verify password, sign token' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    // Same error for unknown email and wrong password — no user enumeration
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, roles: user.roles };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}`,
      },
      { type: 'heading3', text: '3. The guard + @Public() + @CurrentUser()' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      req.user = await this.jwt.verifyAsync(token); // checks signature + exp
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}

@Get('me')
me(@CurrentUser() user: { sub: string; roles: string[] }) {
  return this.users.findById(user.sub);
}`,
      },
      { type: 'heading3', text: 'Passport alternative' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// npm i @nestjs/passport passport passport-jwt
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    });
  }
  validate(payload: { sub: string; roles: string[] }) {
    return { userId: payload.sub, roles: payload.roles }; // becomes req.user
  }
}

@UseGuards(AuthGuard('jwt'))  // from @nestjs/passport
@Get('profile') profile(@Req() req) { return req.user; }`,
      },
      {
        type: 'flow',
        title: 'JWT auth flow in NestJS',
        code: `sequenceDiagram
  participant C as Client
  participant A as AuthController
  participant G as AuthGuard
  participant H as Protected handler
  C->>A: POST /auth/login (email, password)
  A->>A: bcrypt.compare + jwt.signAsync
  A-->>C: accessToken (15m) + refresh token
  C->>G: GET /me with Bearer token
  G->>G: verifyAsync (signature, exp)
  G->>H: req.user = payload
  H-->>C: 200 user profile`,
      },
      {
        type: 'bullets',
        items: [
          '**Refresh tokens**: long-lived, stored hashed in the DB, sent in an `HttpOnly; Secure; SameSite` cookie, rotated on every use so theft can be detected and revoked.',
          '**Keep payload small and non-sensitive** — a JWT is only signed, not encrypted; anyone can base64-decode it.',
          "**Pin the algorithm** (`algorithms: ['HS256']` or RS256 with key pairs when other services verify tokens).",
          'Layer a `RolesGuard` on top for authorization after authentication.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'JWTs cannot be revoked before they expire without extra state. Keep access tokens short (5–15 minutes), and for logout/compromised accounts use refresh-token revocation or a token version/denylist check — mention this trade-off; interviewers almost always ask.',
      },
    ],
  },

  'How do you implement versioned APIs in NestJS?': {
    summary:
      "Call `app.enableVersioning()` with a `VersioningType` — **URI** (`/v1/users`, the most common), **HEADER** (custom header), **MEDIA_TYPE** (`Accept: application/json;v=2`) or **CUSTOM** (your own extractor) — then mark controllers or individual routes with `@Version('1')` / `@Controller({ version: '2' })`. Use `VERSION_NEUTRAL` for routes shared by all versions and `defaultVersion` for unversioned requests.",
    details: [
      {
        type: 'paragraph',
        text: 'Versioning lets you make breaking changes (renamed fields, different response shapes) without breaking existing clients such as mobile apps that cannot be force-updated. Nest has built-in support since v8: you choose where the version lives in the request, and Nest routes to the matching controller or handler.',
      },
      { type: 'heading3', text: 'Enable versioning' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { VersioningType } from '@nestjs/common';

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,  // → /api/v1/users, /api/v2/users
  defaultVersion: '1',       // routes without @Version are treated as v1
});

// Other strategies:
// { type: VersioningType.HEADER, header: 'X-API-Version' }
// { type: VersioningType.MEDIA_TYPE, key: 'v=' }   // Accept: application/json;v=2
// { type: VersioningType.CUSTOM, extractor: (req) => ... }`,
      },
      { type: 'heading3', text: 'Version whole controllers or single routes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';

// v1: returns { name }
@Controller({ path: 'users', version: '1' })
export class UsersV1Controller {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const u = await this.users.findById(id);
    return { id: u.id, name: \`\${u.firstName} \${u.lastName}\` };
  }
}

// v2: breaking change — split name fields
@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findById(id); // { id, firstName, lastName }
  }
}

// Mixed: per-route versions inside one controller
@Controller('orders')
export class OrdersController {
  @Get() @Version('1') listV1() {}
  @Get() @Version(['2', '3']) listV2() {}         // one handler serves v2 and v3
}

// Shared by every version, e.g. health checks
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController { @Get() check() { return { ok: true }; } }`,
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl /api/v1/users/42   # → UsersV1Controller  { "id": 42, "name": "Asha Rao" }
curl /api/v2/users/42   # → UsersV2Controller  { "id": 42, "firstName": "Asha", "lastName": "Rao" }
curl /api/health        # → HealthController (version neutral)`,
      },
      { type: 'heading3', text: 'Choosing a strategy' },
      {
        type: 'bullets',
        items: [
          '**URI** — visible, cache/CDN friendly, easy to test in a browser and route at the gateway. Most public APIs use it.',
          '**Header** — keeps URLs clean, but harder to discover, test and cache (add `Vary` on the header).',
          '**Media type** — most "RESTful" in theory, least convenient in practice.',
          '**Custom** — e.g. read version from a subdomain or a client-specific config.',
        ],
      },
      { type: 'heading3', text: 'Practices that matter more than the mechanism' },
      {
        type: 'bullets',
        items: [
          'Only bump the major version for **breaking** changes; additive changes (new optional fields, new endpoints) stay in the same version.',
          'Share business logic in services; versioned controllers should be thin mapping layers (or use versioned DTOs/serializers).',
          'Announce deprecation with a `Deprecation`/`Sunset` header and docs, monitor v1 traffic, then remove it.',
          'Generate separate Swagger documents per version with `@nestjs/swagger`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interviewers like to hear the policy, not just the decorator: "URI versioning, additive changes without a bump, a deprecation window with `Sunset` headers and traffic monitoring before removing an old version."',
      },
    ],
  },

  'How do you handle file uploads in Express/NestJS?': {
    summary:
      "File uploads arrive as `multipart/form-data`, which `express.json()` cannot parse. In Express use **Multer** (`upload.single('file')`); in NestJS use the built-in `FileInterceptor` (Multer under the hood) with `@UploadedFile()` and `ParseFilePipe` validators. Always enforce size limits, validate the real file type, never trust the client filename, and for large files stream directly to object storage (S3) or use presigned URLs so the file bypasses your server.",
    details: [
      {
        type: 'paragraph',
        text: 'Multer parses the multipart body and either keeps the file in memory (`memoryStorage`, gives `file.buffer`) or writes it to disk (`diskStorage`, gives `file.path`). Memory storage is convenient for small files you forward elsewhere; for large files it can exhaust RAM, so use disk/streaming storage or presigned uploads.',
      },
      { type: 'heading3', text: 'Express + Multer' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';

const upload = multer({
  storage: multer.diskStorage({
    destination: '/var/uploads',
    // Never use the client's filename directly (path traversal, overwrite)
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  },
});

app.post('/avatar', upload.single('avatar'), (req, res) => {
  // req.file = { originalname, mimetype, size, path, ... }; req.body = other text fields
  res.status(201).json({ id: req.file.filename });
});

app.post('/gallery', upload.array('photos', 10), (req, res) => res.json(req.files));

// Multer errors (e.g. LIMIT_FILE_SIZE) reach the error middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code });
  next(err);
});`,
      },
      { type: 'heading3', text: 'NestJS' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// npm i -D @types/multer
import {
  Controller, Post, UseInterceptors, UploadedFile, UploadedFiles,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('documents')
export class DocumentsController {
  constructor(private storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|png|jpe?g)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,           // other form fields, validated as usual
  ) {
    const key = await this.storage.put(file.buffer, file.mimetype); // memory storage by default
    return { key, size: file.size };
  }

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 10))
  batch(@UploadedFiles() files: Express.Multer.File[]) { /* ... */ }
}
// Configure defaults (e.g. disk storage) with MulterModule.register({ dest: './uploads' })
// On the Fastify adapter use @fastify/multipart instead of Multer.`,
      },
      { type: 'heading3', text: 'Large files: presigned URL upload' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Post('upload-url')
async createUploadUrl(@Body() dto: { contentType: string }, @CurrentUser() user) {
  const key = \`uploads/\${user.sub}/\${crypto.randomUUID()}\`;
  const url = await getSignedUrl(
    this.s3,
    new PutObjectCommand({ Bucket: 'my-bucket', Key: key, ContentType: dto.contentType }),
    { expiresIn: 300 },
  );
  return { url, key }; // client PUTs the file straight to S3, then confirms with the key
}`,
      },
      {
        type: 'flow',
        title: 'Presigned upload flow',
        code: `sequenceDiagram
  participant C as Client
  participant API as Nest API
  participant S3 as Object storage
  C->>API: POST /upload-url (type, size)
  API->>API: auth + validate
  API-->>C: presigned PUT URL + key
  C->>S3: PUT file bytes
  S3-->>C: 200 OK
  C->>API: POST /documents (key)
  API->>S3: HEAD object, verify, scan
  API-->>C: 201 Created`,
      },
      {
        type: 'bullets',
        items: [
          '**Limit** size, number of files and fields — otherwise an attacker can fill your disk or RAM.',
          '**Validate content**, not just `mimetype` (it comes from the client): check magic bytes with a library like `file-type`, re-encode images, virus-scan (e.g. ClamAV) where relevant.',
          '**Rename** files to random IDs; store original names only as metadata; serve with `Content-Disposition: attachment` and a safe `Content-Type`.',
          '**Store outside the web root** or in object storage; containers have ephemeral disks.',
          'Process heavy work (thumbnails, PDF parsing) in a background queue, not in the request.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Never write `file.originalname` straight into a path — `../../etc/cron.d/x` is a classic path-traversal attack — and never serve user uploads from the same origin as your app with an HTML/SVG content type, or you have stored XSS.',
      },
    ],
  },
};
