import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'how-express-middleware-works': {
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

  'app-use-vs-app-get': {
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

  'fastify-vs-express': {
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

  'nestjs-vs-express': {
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

  'nest-guards-interceptors-and-pipes': {
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

  'nest-validation-with-class-validator': {
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

  'jwt-authentication-in-nestjs': {
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

  'versioned-apis-in-nestjs': {
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

  'file-uploads-in-express-and-nestjs': {
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

  'structure-a-production-express-app': {
    summary:
      'I split the app into layers with one job each: routes wire URLs to middleware and controllers, controllers translate HTTP into plain function calls, services hold the business rules, and repositories are the only code that talks to the database. Validation and authentication run as middleware at the edge, authorization decisions that depend on data live in the service, and transactions are opened by the service because only it knows which writes form one business operation. Composition happens in one place, so every layer can be tested without Express.',
    details: [
      { type: 'heading3', text: 'The layers and what each may know' },
      {
        type: 'bullets',
        items: [
          '**Routes**: URL + method → middleware chain → controller. No logic.',
          '**Middleware**: cross-cutting edge concerns: request ID, logging, auth (who are you?), validation (is the input well-formed?), rate limiting.',
          '**Controllers**: read `req`, call one service method, map the result to a status code and body. They never touch the database.',
          '**Services**: business rules and orchestration (check stock, apply discount, emit an event). They know nothing about `req`/`res`, so a queue consumer or CLI can call them too.',
          '**Repositories**: queries and persistence. They return domain objects, not ORM internals.',
          '**Error middleware**: the single place where domain errors become HTTP responses (Problem Details, covered in the API Design topic).',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `src/
  app.ts               # builds the Express app (no listen) — imported by tests
  server.ts            # listen, graceful shutdown
  container.ts         # composition root: wires repos → services → controllers
  middleware/          # requestId, auth, validate, errorHandler
  modules/
    orders/
      orders.routes.ts
      orders.controller.ts
      orders.service.ts
      orders.repository.ts
      orders.schemas.ts  # Zod schemas = the HTTP contract
      orders.errors.ts   # OutOfStockError, OrderNotFoundError`,
      },
      {
        type: 'paragraph',
        text: 'I organise by **feature module** (orders, users, billing) rather than by technical layer at the top level (`controllers/`, `services/`). Changes usually touch one feature, and feature folders make later extraction into a separate service much easier.',
      },
      {
        type: 'heading3',
        text: 'A thin controller and a service that owns the transaction',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// orders.routes.ts
router.post('/', requireAuth, validate({ body: CreateOrderBody }), controller.create);

// orders.controller.ts — HTTP in, HTTP out
create = async (req: Request, res: Response) => {
  const order = await this.orders.placeOrder(req.user.id, req.body);
  res.status(201).location('/orders/' + order.id).json(order);
};

// orders.service.ts — business rules + transaction boundary
async placeOrder(userId: string, input: CreateOrderInput): Promise<Order> {
  return this.db.transaction(async (tx) => {
    const items = await this.inventory.reserve(input.items, tx); // throws OutOfStockError
    const order = await this.orderRepo.create({ userId, items }, tx);
    await this.outbox.add('order.placed', { orderId: order.id }, tx);
    return order;
  });
}`,
      },
      { type: 'heading3', text: 'Where each concern belongs' },
      {
        type: 'bullets',
        items: [
          '**Shape validation** (types, required fields, formats): middleware at the edge, before any business code runs.',
          '**Business validation** ("this coupon expired", "stock is insufficient"): the service, because it needs data and rules.',
          '**Authentication**: middleware that verifies the token/session and sets `req.user`.',
          '**Coarse authorization** (role can call this endpoint): middleware. **Resource-level authorization** ("is this order yours?"): the service or repository, using the loaded data — this is where BOLA/IDOR bugs hide when it is left to the route.',
          '**Transactions**: the service. Repositories accept an optional transaction handle; they never start one, because they cannot see the whole operation.',
          '**Side effects** (emails, events): after commit, ideally via an outbox, never inside the request transaction as a network call.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Export `app` from `app.ts` without calling `listen()`. Tests can then use Supertest against the real middleware stack, and `server.ts` stays a tiny file for startup and shutdown.',
      },
      { type: 'heading3', text: 'Trade-offs' },
      {
        type: 'bullets',
        items: [
          'For a small CRUD service, four layers can be ceremony. I collapse service and repository when there are no real business rules, and add the layer when rules appear.',
          'A DI container (tsyringe, awilix) is optional; a hand-written composition root is often clearer in Express. If the team wants enforced structure, that is a point in favour of NestJS.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Why not put the transaction in the repository? — It would only cover one table/collection; the business operation spans several.',
          'How do you pass the current user or tenant to deep layers? — Explicit parameters for business data; `AsyncLocalStorage` for request context such as request ID and tenant.',
          'How do you test a service? — Unit tests with fake repositories; integration tests with a real database (Testcontainers) for repositories.',
          'When would you move to NestJS? — When many teams need the same enforced structure, DI and conventions out of the box.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Fat controllers that query the database and contain business rules.',
          'Services that take `req`/`res`, so they cannot be reused from a worker or tested without HTTP.',
          'Checking ownership only in the route, or not at all, leaving IDOR holes.',
          'Sending emails or calling payment APIs inside a database transaction.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain *why* each concern sits where it does (transaction boundaries follow business operations, authorization needs data), you organise by feature, and you say when you would deliberately use fewer layers.',
      },
    ],
  },

  'validate-requests-with-zod': {
    summary:
      'I define a Zod schema per endpoint for params, query and body, run it in a small `validate` middleware, and replace the raw input with the parsed result, so handlers only ever see typed, trusted data. Validating at the edge means malformed input is rejected with a 400 before it reaches business code, unknown fields are stripped (which prevents mass assignment), and the same schema doubles as the TypeScript type and the OpenAPI contract. Business rules that need the database still belong in the service.',
    details: [
      { type: 'heading3', text: 'Why at the edge' },
      {
        type: 'bullets',
        items: [
          '**Fail fast**: no database calls, locks or partial work for input that was never valid.',
          '**One trust boundary**: everything past the middleware can assume correct types, so services are not littered with defensive checks.',
          '**Security**: strip unknown keys (`role: "admin"` in a profile update), reject operator objects such as `{ "$gt": "" }` that cause NoSQL injection, and cap string and array sizes.',
          '**Consistent errors**: one middleware produces one 400 format for every endpoint.',
        ],
      },
      { type: 'heading3', text: 'Schemas and the middleware' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { z, ZodTypeAny } from 'zod';
import type { RequestHandler } from 'express';

export const CreateOrderBody = z.object({
  items: z.array(z.object({
    sku: z.string().min(1).max(64),
    qty: z.number().int().positive().max(100),
  })).min(1).max(50),
  couponCode: z.string().trim().toUpperCase().optional(),
}); // z.object() strips unknown keys by default; use .strict() to reject them

export const ListOrdersQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20), // query values are strings
  cursor: z.string().optional(),
  status: z.enum(['pending', 'paid', 'shipped']).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderBody>;

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

export const validate = (schemas: Schemas): RequestHandler => (req, res, next) => {
  const issues = [];
  for (const part of ['params', 'query', 'body'] as const) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part]);
    if (!result.success) issues.push(...result.error.issues.map((i) => ({ in: part, ...i })));
    else res.locals[part] = result.data; // parsed, typed, with defaults applied
  }
  if (issues.length) return next(new ValidationError(issues)); // → 400 in the error middleware
  next();
};`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'In Express 5 `req.query` is a getter, so assigning `req.query = parsed` does not work. Store the parsed values in `res.locals` (or a typed property you add to `req`) and read them from there. Writing to `req.body` still works but mixing raw and parsed data in the same place is confusing.',
      },
      { type: 'heading3', text: 'Edge cases that matter in production' },
      {
        type: 'bullets',
        items: [
          '**Body size**: set `express.json({ limit: "100kb" })`; schemas cannot help if a 50 MB body is already parsed.',
          '**Content type**: with no matching parser, `req.body` is `undefined` in Express 5, so the schema should fail clearly instead of crashing on `undefined.items`.',
          '**Coercion only for strings from the URL**: use `z.coerce` for query/params, never for JSON bodies, or `"abc"` silently becomes `NaN` checks and `"true"` becomes truthy.',
          '**Error messages**: return field paths and messages, but do not echo huge invalid values back.',
          '**Responses too**: validating outgoing data (or using a serializer) stops accidental leaks such as `passwordHash`.',
        ],
      },
      { type: 'heading3', text: 'Zod vs the alternatives' },
      {
        type: 'bullets',
        items: [
          '**Zod / Valibot / TypeBox**: schema-first, the type is inferred from the schema. TypeBox produces JSON Schema directly, which pairs well with Fastify and OpenAPI.',
          '**Joi**: mature, but types are separate from the schema.',
          '**class-validator**: decorator DTOs, the NestJS default.',
          '**Ajv + JSON Schema**: fastest at runtime and language-neutral; schemas are more verbose.',
          'To keep the contract single-sourced, generate OpenAPI from the Zod schemas (for example with `zod-to-openapi`) instead of maintaining both by hand.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Strip or reject unknown fields? — Strip for public, evolving clients; `.strict()` for internal APIs where a typo should fail loudly.',
          'Where does "email already registered" go? — The service, enforced by a unique index; it is a business/data rule, not shape validation.',
          'How do you avoid duplicating types between Angular and Node? — Share the schemas in a package, or generate a client from OpenAPI.',
          'Does validation cost much? — Microseconds per request for typical payloads; size limits matter far more.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Validating but then using the raw `req.body`, so stripping and defaults are lost.',
          'Passing `req.body` straight into an ORM update (mass assignment).',
          'Forgetting that query and path params are always strings.',
          'No body size limit.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate shape validation from business validation, treat validation as a security control (mass assignment, injection, size limits), and keep one schema as the source for types, runtime checks and the API contract.',
      },
    ],
  },

  'express-5-changes-and-upgrade-breaks': {
    summary:
      'Express 5 (stable since late 2024) is mostly a clean-up release: rejected promises from handlers and middleware now go to the error middleware automatically, route paths use path-to-regexp v8 with stricter syntax, long-deprecated APIs were removed, and Node.js 18 or newer is required. The upgrade usually breaks wildcard and optional route patterns, old `res.send(status, body)`-style calls, and code that relied on nested query parsing or on `req.body` defaulting to `{}`. I upgrade by running the official codemods, fixing route strings, and leaning on integration tests.',
    details: [
      { type: 'heading3', text: 'The headline improvement: async errors' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Express 5: a rejected promise or a throw inside an async handler calls next(err)
app.get('/orders/:id', async (req, res) => {
  const order = await orders.get(req.params.id); // rejection → error middleware
  if (!order) throw new NotFoundError('order');   // also → error middleware
  res.json(order);
});
// In Express 4 the same code left the request hanging (or crashed the process
// on an unhandled rejection), so teams used wrappers like express-async-handler.`,
      },
      {
        type: 'paragraph',
        text: 'After upgrading you can delete the async wrapper helpers, but errors thrown from callbacks or timers (outside the returned promise) are still not caught — only the promise the handler returns is observed.',
      },
      { type: 'heading3', text: 'Route syntax (path-to-regexp v8)' },
      {
        type: 'bullets',
        items: [
          'A bare wildcard `*` is no longer allowed; wildcards must be named: `/files/*splat`. The value arrives as an array of segments in `req.params.splat`.',
          '`/*splat` does not match the root path; use `/{*splat}` to match both `/` and everything below it.',
          'The optional `?` suffix is replaced by braces: `/:file{.:ext}` instead of `/:file.:ext?`.',
          'Regular-expression characters inside string paths (such as `(\\d+)`) are no longer supported. Validate the parameter instead, or use an actual `RegExp` route.',
          'Reserved characters such as `(`, `)`, `[`, `]`, `?`, `+`, `!` must be escaped in path strings.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Express 4                         // Express 5
app.get('*', spaFallback);           app.get('/{*splat}', spaFallback);
app.get('/assets/*', serveAsset);    app.get('/assets/*path', serveAsset);
app.get('/:file.:ext?', getFile);    app.get('/:file{.:ext}', getFile);
app.get('/user/:id(\\\\d+)', getUser); app.get('/user/:id', validateId, getUser);`,
      },
      { type: 'heading3', text: 'Removed or changed APIs' },
      {
        type: 'bullets',
        items: [
          '`app.del()` → `app.delete()`.',
          '`req.param(name)` removed → read `req.params`, `req.query` or `req.body` explicitly.',
          '`res.sendfile()` → `res.sendFile()`.',
          '`res.send(status, body)`, `res.json(obj, status)` and `res.send(200)` signatures removed → `res.status(201).json(obj)` and `res.sendStatus(204)`.',
          'The magic string `"back"` for `res.redirect()` / `res.location()` is removed → use `req.get("Referrer") || "/"`.',
          '`res.status()` now throws on invalid status codes instead of silently sending them.',
          'Pluralised helpers: `req.acceptsCharset` → `req.acceptsCharsets`, and similar for encodings and languages.',
        ],
      },
      { type: 'heading3', text: 'Request parsing changes' },
      {
        type: 'bullets',
        items: [
          '**Query parser defaults to "simple"** (Node `querystring`) instead of "extended" (`qs`). `?filter[status]=paid` is no longer turned into a nested object. Restore it with `app.set("query parser", "extended")` if your API depends on it, and validate the result.',
          '**`req.query` is a getter**: you cannot reassign it in middleware.',
          '**`req.body` is `undefined`** when no body parser ran, instead of `{}`. Code like `req.body.email` without a parser now throws.',
          '**`express.urlencoded()` defaults to `extended: false`**.',
        ],
      },
      { type: 'heading3', text: 'How I run the upgrade' },
      {
        type: 'numbered',
        items: [
          'Check Node.js is 18+ everywhere (CI, Docker base image, Lambda runtime).',
          'Run the official codemods (`npx @expressjs/codemod upgrade`) for the mechanical renames.',
          'Grep for route strings containing `*`, `?`, `(` and fix them by hand; these fail at startup, which is good.',
          'Search for nested query usage and `req.body` access without a parser.',
          'Remove async wrapper helpers once tests confirm errors reach the error middleware.',
          'Check third-party middleware for Express 5 compatibility, then deploy with a canary.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Is it still worth choosing Express for a new service? — Yes if the team knows it and needs flexibility; Fastify or NestJS if you want schema validation, structure or throughput built in.',
          'Why did the query parser default change? — Nested parsing has been a source of prototype-pollution and type-confusion bugs; simple is safer.',
          'Do you still need try/catch in handlers? — Only when you want to recover or translate an error locally.',
          'What breaks silently, not at startup? — Query parsing and `req.body` defaults; route syntax errors fail fast.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Upgrading without integration tests and discovering the SPA fallback route no longer matches.',
          'Assuming callback-based code inside handlers is now caught too.',
          'Turning the extended query parser back on without validating the nested objects.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate changes that fail loudly (route syntax) from ones that change behaviour silently (query parsing, `req.body`), and you describe a staged, test-backed rollout rather than "bump the version".',
      },
    ],
  },

  'request-never-responds-no-logs': {
    summary:
      'A hanging request means some code path neither sent a response nor called `next()`, or it is awaiting a promise that never settles. The usual causes are a middleware that forgets `next()`, a branch that returns without responding, an outbound call or database pool acquire with no timeout, a swallowed async error in Express 4, or a response that was written but never ended. I find it by logging request start and finish with a request ID, alerting on requests open longer than a threshold, and checking pool and dependency metrics; then I add timeouts everywhere so a hang becomes a visible error.',
    details: [
      { type: 'heading3', text: 'The likely causes' },
      {
        type: 'numbered',
        items: [
          '**Middleware that never calls `next()`** — often an early `return` on one branch, or an auth middleware whose callback API was never invoked.',
          '**A handler branch that does not respond**: `if (!user) return;` instead of `return res.status(404)...`.',
          '**A promise that never settles**: an HTTP call to a dependency with no timeout, a queue `await` with no reply, or `pool.connect()` waiting forever because the pool is exhausted (leaked connections).',
          '**Swallowed async errors (Express 4)**: an `async` handler throws, nothing calls `next(err)`, and if someone registered `process.on("unhandledRejection", () => {})` the error disappears silently.',
          '**`res.write()` without `res.end()`**, or a stream piped into `res` that errors without cleanup.',
          '**Body never read**: a custom middleware waits for `req.on("end")` after another middleware already consumed the stream, or a client sent a `Content-Length` larger than the body.',
          '**An error middleware that does not respond**, for example it logs and then forgets to send anything.',
        ],
      },
      { type: 'heading3', text: 'Make the hang visible' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { randomUUID } from 'node:crypto';

app.use((req, res, next) => {
  const id = (req.get('x-request-id') as string) || randomUUID();
  const start = process.hrtime.bigint();
  res.setHeader('x-request-id', id);
  logger.info({ id, method: req.method, url: req.originalUrl }, 'request start');

  // Watchdog: log requests still open after 10 s, with where they are stuck
  const watchdog = setTimeout(() => {
    logger.warn({ id, url: req.originalUrl, stage: res.locals.stage }, 'request still open');
  }, 10_000);

  res.on('close', () => {
    clearTimeout(watchdog);
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info({ id, status: res.statusCode, ms, finished: res.writableFinished }, 'request end');
  });
  next();
});`,
      },
      {
        type: 'paragraph',
        text: 'A "start" log with no "end" log for the same ID tells me the request is stuck in my process, not lost at the load balancer. Setting `res.locals.stage = "db:getOrder"` at key points (or using spans from OpenTelemetry) shows how far it got. If the load balancer reports a 504 but my process never logged "start", the problem is before Express: proxy timeouts, keep-alive mismatch or an event loop so blocked that the request was never accepted.',
      },
      { type: 'heading3', text: 'Narrowing it down' },
      {
        type: 'bullets',
        items: [
          '**Traces**: the last completed span shows which dependency call never returned.',
          '**Pool metrics**: `pool.totalCount`, `idleCount` and `waitingCount` (node-postgres), or the driver connection pool events for MongoDB. A growing waiting count means exhaustion.',
          '**Event loop lag**: `perf_hooks.monitorEventLoopDelay()`. If it is high, everything is slow and the problem is CPU, not one route.',
          '**Reproduce with a debugger or `--inspect`**: pause the process and look at pending async work; `why-is-node-running` lists open handles in a test.',
          '**Search for no-op `unhandledRejection` handlers** and empty `catch {}` blocks.',
        ],
      },
      { type: 'heading3', text: 'Prevent it' },
      {
        type: 'bullets',
        items: [
          'Timeouts on every outbound call (`AbortSignal.timeout()` for `fetch`), on pool acquisition (`connectionTimeoutMillis`), and on queries (`statement_timeout`, `maxTimeMS`).',
          'A request-level timeout middleware that responds 503/504 and aborts downstream work.',
          'Express 5 (or an async wrapper in Express 4) so thrown errors reach the error middleware.',
          'Lint rules such as `@typescript-eslint/no-floating-promises`.',
          'Server timeouts: `server.requestTimeout` and `headersTimeout` stop slow or stalled clients holding sockets forever.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Why might nothing be logged even though the code throws? — Express 4 async throw plus a silent `unhandledRejection` handler or empty catch.',
          'How do you tell a slow request from a hung one? — Duration histograms vs requests with a start log and no end log.',
          'What timeout value do you choose? — Below the load balancer and client timeouts, so the server answers before the proxy gives up.',
          'How do you find a leaked DB connection? — Pool waiting count rising, plus code paths that acquire a client without `finally { client.release() }`.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Raising the load balancer timeout instead of finding the hang.',
          'Adding timeouts only on HTTP calls and forgetting pool acquisition.',
          'Logging only on completion, so hung requests leave no trace.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you reason from evidence (start without end, traces, pool and event-loop metrics), you know the Express 4 async trap and silent rejection handlers, and you finish by making every wait bounded so the next hang turns into a clear error.',
      },
    ],
  },

  'cancel-work-on-disconnect-or-timeout': {
    summary:
      'I create an `AbortController` per request, abort it when the response closes before it finished (client went away) or when a request deadline passes, and pass its `signal` to everything that supports cancellation: `fetch`, timers, my own async functions and database calls where the driver allows it. `AbortSignal.timeout()` and `AbortSignal.any()` let me combine the request signal with per-call deadlines. Databases often cannot be cancelled through the signal, so I also set server-side limits such as `statement_timeout` or `maxTimeMS`.',
    details: [
      { type: 'heading3', text: 'Why it matters' },
      {
        type: 'paragraph',
        text: 'If a user closes the tab or the load balancer gives up after 30 s, Node keeps running the handler: queries, fan-out calls and CPU work continue for a response nobody will read. Under load this wastes capacity exactly when it is scarce, and it is how a slow dependency turns into a cascading outage.',
      },
      { type: 'heading3', text: 'Detecting a disconnect correctly' },
      {
        type: 'bullets',
        items: [
          'Listen on **`res.on("close")`** and check **`!res.writableFinished`**: the connection closed before we finished writing, so the client is gone.',
          'Do not rely on `req.on("close")` alone: in modern Node it also fires once the request body has been fully read, which is normal for every POST.',
          '`req.aborted` and the `"aborted"` event are deprecated; use `res.writableFinished`, `req.destroyed` or the signal pattern below.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// middleware/requestSignal.ts
export const requestSignal = (timeoutMs = 10_000): RequestHandler => (req, res, next) => {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) controller.abort(new Error('client disconnected'));
  });
  // Combine "client left" with a per-request deadline
  res.locals.signal = AbortSignal.any([controller.signal, AbortSignal.timeout(timeoutMs)]);
  next();
};

// handler
app.get('/dashboard', requestSignal(8_000), async (req, res) => {
  const signal: AbortSignal = res.locals.signal;
  const [orders, stats] = await Promise.all([
    fetch(ORDERS_URL, { signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]) }),
    statsService.load(req.user.id, { signal }),
  ]);
  res.json({ orders: await orders.json(), stats });
});`,
      },
      {
        type: 'paragraph',
        text: 'When the signal aborts, `fetch` rejects with an `AbortError` (or a `TimeoutError` for `AbortSignal.timeout()`), the `Promise.all` rejects, and the error middleware can skip writing if the client is already gone (`res.headersSent` / `res.writableEnded`) or return 504 on a timeout.',
      },
      { type: 'heading3', text: 'Making your own code cancellable' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { setTimeout as sleep } from 'node:timers/promises';

async function loadReport(ids: string[], { signal }: { signal: AbortSignal }) {
  const results = [];
  for (const id of ids) {
    signal.throwIfAborted();                 // stop between steps
    results.push(await computeChunk(id));
    await sleep(0, undefined, { signal });   // timers/promises accept a signal too
  }
  return results;
}`,
      },
      { type: 'heading3', text: 'Databases: the hard part' },
      {
        type: 'bullets',
        items: [
          'Aborting the JavaScript promise does **not** necessarily stop the query on the server. The database keeps working unless the driver sends a cancel.',
          '**PostgreSQL**: set `statement_timeout` (per role, per connection or `SET LOCAL` inside a transaction). True cancellation means `pg_cancel_backend` from another connection, which most apps do not wire to request signals.',
          '**MongoDB**: set `maxTimeMS` on queries and aggregations so the server stops the operation itself.',
          'Use `AbortSignal.timeout()` for **pool acquisition** too, or the driver option such as `connectionTimeoutMillis`, so a request does not wait forever for a connection.',
          'Never abort in the middle of a multi-step write without a transaction; cancellation must leave data consistent. For writes I usually let the transaction finish or roll back, and only cancel reads and fan-out.',
        ],
      },
      { type: 'heading3', text: 'Server-level timeouts' },
      {
        type: 'bullets',
        items: [
          '`server.requestTimeout` (default 300 s since Node 18): maximum time to receive the whole request.',
          '`server.headersTimeout` (default 60 s): maximum time to receive the headers; protects against slowloris-style clients.',
          '`server.keepAliveTimeout`: keep it slightly **above** the load balancer idle timeout to avoid intermittent 502s.',
          'These protect sockets, not handler work. Handler deadlines still need the signal pattern.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do deadlines propagate across services? — Send the remaining budget in a header (gRPC does this natively) and create a matching `AbortSignal.timeout()` downstream.',
          'What should happen to a write if the client disconnects? — Usually complete it; make the endpoint idempotent so the client can safely retry.',
          'Does aborting free the CPU from a tight loop? — No; signals are cooperative. CPU-bound work must check the signal or run in a worker that you terminate.',
          'What status do you return on a deadline? — 504 when a dependency timed out, 503 when you shed load; nothing if the client already left.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Using `req.on("close")` and aborting every POST as soon as its body is read.',
          'Assuming an aborted promise also cancelled the database query.',
          'Server timeouts longer than the load balancer timeout, so work continues after the proxy already returned 504.',
          'Cancelling a write half-way without a transaction.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you know cancellation is cooperative and stops at the database boundary unless the server enforces its own limit, you combine client-disconnect and deadline signals, and you treat writes differently from reads.',
      },
    ],
  },

  'nest-modules-and-provider-scopes': {
    summary:
      'A module groups related providers, controllers and imports, and controls visibility: a provider is only injectable outside its module if the module `exports` it and the consumer `imports` the module. Providers are singletons by default (`Scope.DEFAULT`), created once at bootstrap. `Scope.REQUEST` creates a new instance per request and `Scope.TRANSIENT` a new instance per consumer. Request scope is contagious: it bubbles up the injection chain, so every controller and service that depends on it is also recreated on every request, which costs allocations, GC pressure and latency. I keep request scope rare and prefer passing context explicitly or using `AsyncLocalStorage`.',
    details: [
      { type: 'heading3', text: 'Modules: boundaries and visibility' },
      {
        type: 'paragraph',
        text: 'Each module has its own injector scope. Providers listed in `providers` are private to the module unless they are also in `exports`. Importing a module gives you access to its exported providers only, which is what lets you keep internals (repositories, mappers) hidden behind a public service.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Module({
  imports: [TypeOrmModule.forFeature([Order]), PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderMapper],
  exports: [OrdersService], // repository and mapper stay private
})
export class OrdersModule {}`,
      },
      {
        type: 'bullets',
        items: [
          '**Global modules** (`@Global()`): exported providers are available everywhere without importing. Use them sparingly for true cross-cutting infrastructure (config, logger); overusing them hides dependencies.',
          '**Dynamic modules** (`forRoot` / `forRootAsync` / `forFeature`): a static method returns a `DynamicModule` with providers built from options. `forRootAsync` lets options come from another provider, typically `ConfigService`.',
          '**`ConfigurableModuleBuilder`**: generates the `forRoot`/`forRootAsync` boilerplate and the options injection token, so library-style modules stay small and consistent.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<{ baseUrl: string; timeoutMs: number }>()
    .setClassMethodName('forRoot')
    .build();

@Module({ providers: [BillingClient], exports: [BillingClient] })
export class BillingModule extends ConfigurableModuleClass {}

// app.module.ts
BillingModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    baseUrl: config.getOrThrow('BILLING_URL'),
    timeoutMs: 3000,
  }),
});`,
      },
      { type: 'heading3', text: 'The three scopes' },
      {
        type: 'bullets',
        items: [
          '**`Scope.DEFAULT`** (singleton): one instance for the whole app, created at bootstrap. This is the right choice for almost every stateless service. It must not hold per-request state in fields.',
          '**`Scope.REQUEST`**: a new instance for each incoming request, garbage-collected after it. It can inject `REQUEST` to read the request object.',
          "**`Scope.TRANSIENT`**: every consumer gets its own instance (not shared between injectors). Useful for something like a logger that carries the consumer's class name as context.",
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}
  get tenantId(): string {
    return this.req.headers['x-tenant-id'] as string;
  }
}`,
      },
      { type: 'heading3', text: 'Why request scope hurts performance' },
      {
        type: 'paragraph',
        text: 'Scope **bubbles up** the injection chain. If `OrdersService` injects `TenantContext` (request-scoped), `OrdersService` becomes request-scoped too, and so does `OrdersController` that injects it. On every request Nest now builds that whole sub-graph: resolving dependencies, calling constructors, allocating objects, and later collecting them. Singletons further down are still shared, but everything above the request-scoped provider is rebuilt.',
      },
      {
        type: 'bullets',
        items: [
          '**Latency and throughput**: per-request instantiation adds overhead on the hot path; the official docs warn that it slows down the app, and the effect grows with the depth of the dependency chain.',
          '**GC pressure**: many short-lived objects per request mean more frequent garbage collection under load.',
          '**Surprises**: request-scoped providers cannot be used in places without a request (cron jobs, queue consumers, `onModuleInit`) unless you create a context yourself with `ModuleRef.resolve()` and a `ContextIdFactory` context id.',
          '**Constructor work multiplies**: any expensive setup in a request-scoped constructor now runs per request.',
        ],
      },
      { type: 'heading3', text: 'Alternatives and mitigations' },
      {
        type: 'numbered',
        items: [
          '**Pass context explicitly** as a method argument (`service.list(tenantId, query)`). Simple, testable, no magic.',
          '**`AsyncLocalStorage`** (or `nestjs-cls`): set the context once in a middleware or guard and read it from singletons. You get request context without request scope.',
          '**Durable providers**: with a custom `ContextIdStrategy` and `durable: true`, Nest creates one sub-tree per tenant (or other key) instead of per request, which is a good fit for multi-tenant apps that need per-tenant instances.',
          '**Keep request scope at the leaves**: if you must use it, make sure only a small, shallow part of the graph depends on it.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Singleton service reading request context via AsyncLocalStorage
@Injectable()
export class RequestContext {
  private readonly als = new AsyncLocalStorage<{ tenantId: string; requestId: string }>();
  run<T>(ctx: { tenantId: string; requestId: string }, fn: () => T) {
    return this.als.run(ctx, fn);
  }
  get tenantId() {
    return this.als.getStore()?.tenantId;
  }
}

// middleware
use(req: Request, _res: Response, next: NextFunction) {
  this.ctx.run(
    { tenantId: String(req.headers['x-tenant-id']), requestId: randomUUID() },
    next,
  );
}`,
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How would you get a request-scoped provider inside a queue consumer? Hint: `ContextIdFactory.create()` plus `moduleRef.resolve(Provider, contextId)`, or avoid request scope there.',
          'What is the difference between `get()` and `resolve()` on `ModuleRef`? Hint: `get` returns static (singleton) instances; `resolve` creates or returns scoped (request/transient) instances for a context id.',
          'When would you use a global module? Hint: config or logging used everywhere; never for domain services.',
          'How do durable providers work? Hint: a `ContextIdStrategy` maps requests to a shared context id (e.g. per tenant) so the sub-tree is reused.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Storing per-request data in a field of a singleton service, which leaks data between concurrent requests.',
          'Making a deep service request-scoped "just to read the user", silently turning half the app request-scoped.',
          'Marking every shared module `@Global()`, which hides dependencies and makes modules impossible to reuse or test in isolation.',
          'Forgetting to export a provider and then "fixing" the resulting injection error by re-declaring it in another module, which creates a second instance.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain scope bubbling, measure the cost instead of guessing, and reach for explicit context, `AsyncLocalStorage` or durable providers before request scope. You also use module exports deliberately to enforce boundaries between features.',
      },
    ],
  },

  'nest-circular-dependencies-forwardref': {
    summary:
      "A circular dependency is when A needs B and B needs A, either between providers or between modules. Nest can break the cycle with `forwardRef(() => X)` on both sides, but I treat that as a temporary patch: a cycle usually means two services share responsibilities or one is reaching into the other's internals. My preferred fixes are extracting the shared logic into a third provider, inverting the dependency with an interface or event, or merging the two if they really are one concept.",
    details: [
      { type: 'heading3', text: 'How the error shows up' },
      {
        type: 'paragraph',
        text: 'At bootstrap Nest fails with "Nest can\'t resolve dependencies of the X (?)" or a message about a circular dependency, often with `undefined` at the index of the dependency. It also happens with plain file imports: if two files import each other, one of them sees the other\'s class as `undefined` at decoration time. Barrel files (`index.ts`) that re-export everything make this more likely.',
      },
      { type: 'heading3', text: 'The mechanical fix: forwardRef' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Provider-level cycle
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly users: UsersService,
  ) {}
}

// Module-level cycle: both modules must use forwardRef
@Module({ imports: [forwardRef(() => OrdersModule)], exports: [UsersService] })
export class UsersModule {}`,
      },
      {
        type: 'bullets',
        items: [
          'Both sides need `forwardRef`, otherwise one side still sees `undefined`.',
          'Instantiation order becomes non-deterministic, so neither constructor may call the other service. Using it inside methods is fine.',
          'It does not work well with request-scoped providers in a cycle; avoid that combination.',
          'Alternative: inject `ModuleRef` and call `moduleRef.get(OrdersService, { strict: false })` lazily in `onModuleInit`, which is still a workaround.',
        ],
      },
      { type: 'heading3', text: 'What the cycle is telling you' },
      {
        type: 'paragraph',
        text: 'In a healthy design, dependencies point one way: controllers → application services → domain → infrastructure, and feature modules depend on shared modules, not on each other in both directions. A cycle usually means one of these:',
      },
      {
        type: 'bullets',
        items: [
          '**Shared logic in the wrong place**: both services need "calculate a user\'s order stats", so each calls the other.',
          '**A missing concept**: an `OrderPricing` or `Checkout` service that orchestrates users and orders does not exist yet.',
          '**Side effects coupled to the core action**: "when an order is placed, update the user\'s loyalty points" written as a direct call instead of an event.',
          '**Boundaries that are not real**: two modules that change together and call each other constantly may be one module.',
        ],
      },
      { type: 'heading3', text: 'Design fixes, in the order I try them' },
      {
        type: 'numbered',
        items: [
          '**Extract a third provider** that both depend on (`UserStatsService`), or an orchestrator that depends on both (`CheckoutService`), so the arrows point one way.',
          '**Use events for side effects**: `OrdersService` emits `order.placed` with `@nestjs/event-emitter` (or a queue), and a listener in the users module reacts. The orders module no longer knows about users.',
          '**Invert the dependency**: the lower-level module defines an interface and an injection token; the higher-level module provides the implementation.',
          '**Merge** the modules if they are really one bounded context.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: OrdersService -> UsersService -> OrdersService
// After: orders emits an event, users listens. No cycle.
@Injectable()
export class OrdersService {
  constructor(private readonly events: EventEmitter2, private readonly repo: OrdersRepository) {}

  async place(dto: PlaceOrderDto) {
    const order = await this.repo.create(dto);
    this.events.emit('order.placed', { orderId: order.id, userId: dto.userId, total: order.total });
    return order;
  }
}

@Injectable()
export class LoyaltyListener {
  constructor(private readonly users: UsersService) {}

  @OnEvent('order.placed')
  async handle(e: { userId: string; total: number }) {
    await this.users.addPoints(e.userId, Math.floor(e.total / 10));
  }
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'In-process events are not durable: if the process crashes after the order is saved, the listener never runs. For side effects that must happen, use a transactional outbox and a queue instead of `EventEmitter2`.',
      },
      { type: 'heading3', text: 'Preventing cycles' },
      {
        type: 'bullets',
        items: [
          'Detect file-level cycles in CI with `madge --circular` or the ESLint `import/no-cycle` rule.',
          'Avoid barrel files inside a feature; import from the concrete file.',
          'Write down the allowed dependency direction between modules and enforce it with lint boundaries in a monorepo.',
        ],
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Why does a file-level import cycle give you `undefined`? Hint: ES/CommonJS modules evaluate in order, so the class is not yet defined when the decorator metadata is read.',
          'Is `forwardRef` ever acceptable long term? Hint: occasionally for genuinely bidirectional entities, but document it and keep constructors free of calls.',
          'How would you decouple with events without losing reliability? Hint: outbox table written in the same transaction, then a relay to a queue.',
          'How do you find all cycles in a large codebase? Hint: `madge`, `dependency-cruiser`, or Nx project-graph boundaries.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Adding `forwardRef` on only one side and getting an intermittent `undefined` dependency.',
          'Calling the circular dependency inside a constructor.',
          'Sprinkling `forwardRef` everywhere until it boots, leaving a tangled module graph.',
          'Replacing a direct call with an in-memory event for something that must not be lost.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you know the `forwardRef` mechanics but treat a cycle as a design smell, explain which responsibility is misplaced, and fix the dependency direction (extract, orchestrate, events, inversion), adding tooling so cycles cannot creep back in.',
      },
    ],
  },

  'test-nest-services-and-controllers': {
    summary:
      'I build a small testing module with `Test.createTestingModule()`, list the class under test and replace its collaborators with fakes via `{ provide: X, useValue: mock }` or `overrideProvider(X).useValue(mock)`. Service tests check business logic with mocked repositories. Controller tests are thin, so I prefer e2e-style tests with `createNestApplication()` and `supertest`, which also exercise pipes, guards and filters. For data access, I run integration tests against a real database in a container rather than mocking the ORM.',
    details: [
      { type: 'heading3', text: 'Unit test for a service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `describe('OrdersService', () => {
  let service: OrdersService;
  const repo = { findById: jest.fn(), save: jest.fn() };
  const payments = { charge: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: repo },
        { provide: PaymentsClient, useValue: payments },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('charges and marks the order paid', async () => {
    repo.findById.mockResolvedValue({ id: 'o1', status: 'pending', total: 50 });
    payments.charge.mockResolvedValue({ id: 'ch_1' });

    await service.pay('o1');

    expect(payments.charge).toHaveBeenCalledWith(50, expect.any(String));
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  });

  it('throws NotFoundException for an unknown order', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.pay('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});`,
      },
      {
        type: 'bullets',
        items: [
          'Only register what the class needs; do not import the whole `AppModule` into a unit test.',
          'For simple services you can skip the testing module entirely and use `new OrdersService(repo as any, payments as any)`. The testing module pays off when DI tokens, custom providers or decorators matter.',
          'Mocks for TypeORM repositories use the token from `getRepositoryToken(Order)`; for Mongoose models, `getModelToken(Order.name)`.',
        ],
      },
      { type: 'heading3', text: 'Overriding providers in a bigger module' },
      {
        type: 'paragraph',
        text: 'When you want the real module wiring but need to replace one dependency (an external API client, the clock, a mailer), import the module and override.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `const moduleRef = await Test.createTestingModule({ imports: [OrdersModule] })
  .overrideProvider(PaymentsClient)
  .useValue({ charge: jest.fn().mockResolvedValue({ id: 'ch_test' }) })
  .overrideGuard(JwtAuthGuard)
  .useValue({ canActivate: () => true })
  .compile();`,
      },
      {
        type: 'paragraph',
        text: 'Besides `overrideProvider`, there are `overrideGuard`, `overrideInterceptor`, `overridePipe`, `overrideFilter` and, in recent versions, `overrideModule`. Each supports `useValue`, `useClass` or `useFactory`.',
      },
      { type: 'heading3', text: 'Controller and pipeline: e2e with supertest' },
      {
        type: 'paragraph',
        text: 'A controller method is usually one line that calls a service, so a unit test with a mocked service proves little. An HTTP-level test proves routing, validation, guards, serialization, status codes and the exception filter together.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `describe('Orders API (e2e)', () => {
  let app: INestApplication;
  const ordersService = { pay: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OrdersService)
      .useValue(ordersService)
      .compile();

    app = moduleRef.createNestApplication();
    // Apply the same global setup as main.ts, or tests diverge from production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('400 on an invalid body', () =>
    request(app.getHttpServer()).post('/orders/o1/pay').send({ amount: 'x' }).expect(400));

  it('404 is mapped by the exception filter', async () => {
    ordersService.pay.mockRejectedValue(new NotFoundException());
    await request(app.getHttpServer()).post('/orders/o1/pay').send({ amount: 10 }).expect(404);
  });
});`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Move global setup (pipes, filters, interceptors, versioning, prefix) into a `configureApp(app)` function called from both `main.ts` and the tests. Otherwise e2e tests pass while production behaves differently.',
      },
      { type: 'heading3', text: 'Real database for repository code' },
      {
        type: 'bullets',
        items: [
          'Mocking the ORM tests your mock, not your query. For repositories, run against a real database with Testcontainers (Postgres or MongoDB) or `mongodb-memory-server`.',
          'Reset state between tests with transactions rolled back, truncation, or a fresh schema per test file.',
          'Keep these as a separate, slower suite that still runs on every pull request.',
        ],
      },
      { type: 'heading3', text: 'Testing request-scoped providers' },
      {
        type: 'paragraph',
        text: 'Request-scoped providers cannot be fetched with `get()`. Create a context id and resolve: `const contextId = ContextIdFactory.create(); moduleRef.registerRequestByContextId(fakeRequest, contextId); const svc = await moduleRef.resolve(TenantContext, contextId);`.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you test a guard on its own? Hint: instantiate it and pass a fake `ExecutionContext` (e.g. with `createMock` from `@golevelup/ts-jest`).',
          'Unit test vs e2e for controllers: which do you write? Hint: thin controllers → HTTP tests; unit test only real logic.',
          'How do you keep e2e tests fast? Hint: one app per file in `beforeAll`, containers started once per run, parallel workers with isolated databases.',
          'How do you test a cron job or queue consumer? Hint: call the handler method directly with a fake job; test scheduling separately.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Importing `AppModule` into every unit test, which makes tests slow and couples them to everything.',
          'E2E tests that skip the global pipes and filters configured in `main.ts`.',
          'Mocking the repository and the ORM for everything, so no test ever runs a real query.',
          'Not calling `app.close()`, leaving open handles that make Jest hang.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you choose the test level by risk (logic in services → unit, wiring and HTTP contract → e2e, queries → real database), share app configuration between production and tests, and know the override APIs for guards, providers and modules.',
      },
    ],
  },
};
