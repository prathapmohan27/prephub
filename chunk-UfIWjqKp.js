var e={"http-methods-and-when-to-use-each":{summary:"`GET` reads a resource, `POST` creates one (or triggers a non-idempotent action), `PUT` replaces a resource entirely, `PATCH` partially updates it, and `DELETE` removes it. The key properties to mention are **safety** (GET does not change state) and **idempotency** (GET, PUT and DELETE can be repeated with the same result; POST cannot, PATCH is not guaranteed to be).",details:[{type:`paragraph`,text:"HTTP methods express the intent of a request. In a REST API the URL identifies the resource (`/api/users/42`) and the method says what to do with it. Choosing the right method matters because browsers, proxies, caches, retry logic and API gateways all make decisions based on it."},{type:`heading3`,text:`The five methods against one resource`},{type:`code`,lang:`text`,code:`GET    /api/users          \u2192 200 list of users        (read collection)
GET    /api/users/42       \u2192 200 user 42              (read one)
POST   /api/users          \u2192 201 Created + Location   (create; server assigns the id)
PUT    /api/users/42       \u2192 200/204                  (replace the whole user 42)
PATCH  /api/users/42       \u2192 200/204                  (change only the fields sent)
DELETE /api/users/42       \u2192 204 No Content           (remove user 42)`},{type:`heading3`,text:`Safe and idempotent — the properties interviewers want`},{type:`bullets`,items:["**Safe** = does not modify server state. Only `GET` (plus `HEAD`, `OPTIONS`) is safe, so it can be cached, prefetched and retried freely.","**Idempotent** = sending it N times has the same effect as sending it once. `GET`, `PUT`, `DELETE` are idempotent: deleting user 42 twice still leaves user 42 deleted (the second call may return 404, but the state is the same).","`POST` is neither: submitting an order twice creates two orders. That is why payment APIs use an **idempotency key** header.",'`PATCH` is not idempotent by definition — `{ "op": "increment", "field": "views" }` changes the result each time — although a simple "set these fields" patch behaves idempotently in practice.']},{type:`heading3`,text:`Calling them from Angular`},{type:`code`,lang:`typescript`,code:"@Injectable({ providedIn: 'root' })\nexport class UserApi {\n  private http = inject(HttpClient);\n  private base = '/api/users';\n\n  list()                          { return this.http.get<User[]>(this.base); }\n  get(id: number)                 { return this.http.get<User>(`${this.base}/${id}`); }\n  create(body: NewUser)           { return this.http.post<User>(this.base, body); }\n  replace(id: number, body: User) { return this.http.put<User>(`${this.base}/${id}`, body); }\n  update(id: number, body: Partial<User>) {\n    return this.http.patch<User>(`${this.base}/${id}`, body);\n  }\n  remove(id: number)              { return this.http.delete<void>(`${this.base}/${id}`); }\n}"},{type:`flow`,title:`Picking the method`,code:`flowchart TD
  Q{"Does the request<br/>change data?"} -->|No| G["GET"]:::cache
  Q -->|Yes| C{"What kind of change?"}
  C -->|"Create, server picks id"| P["POST"]:::server
  C -->|"Replace whole resource"| PU["PUT"]:::server
  C -->|"Change some fields"| PA["PATCH"]:::server
  C -->|"Remove"| D["DELETE"]:::db
  C -->|"Action / command<br/>e.g. send email"| P`},{type:`bullets`,items:["Common status codes: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500` server error.","Use `POST` for actions that do not map to CRUD (`POST /orders/42/cancel`) and for complex searches whose criteria do not fit in a URL.","`HEAD` (headers only) and `OPTIONS` (used by the browser for CORS preflight) are the other methods worth naming."]},{type:`callout`,variant:`tip`,text:`Interview tip: go beyond "GET reads, POST writes". Mention safety and idempotency and give the retry example — "it is safe to automatically retry a PUT or DELETE after a timeout, but not a POST without an idempotency key".`},{type:`divider`},{type:`heading3`,text:"Follow-up: What is the difference between `PUT` (`full replacement`) and `PATCH` (`partial update`) HTTP methods when updating resource data?"},{type:`paragraph`,text:"`PUT` sends the complete new representation of a resource and replaces whatever is stored — fields you omit are cleared or reset. `PATCH` sends only the changes, leaving other fields untouched. `PUT` is idempotent by definition; `PATCH` is not guaranteed to be."},{type:`paragraph`,text:"Both methods update an existing resource, but they disagree on what the body means. With `PUT` the body IS the new resource. With `PATCH` the body is a set of instructions describing how to modify the resource."},{type:`heading3`,text:`Same starting data, two requests`},{type:`code`,lang:`json`,code:`// Stored: GET /api/users/42
{ "id": 42, "name": "Asha", "email": "asha@mail.com", "role": "admin" }

// PUT /api/users/42   body: { "id": 42, "name": "Asha K" }
// Result \u2192 { "id": 42, "name": "Asha K", "email": null, "role": null }
//          email and role were NOT sent, so they are gone (or reset to defaults)

// PATCH /api/users/42 body: { "name": "Asha K" }
// Result \u2192 { "id": 42, "name": "Asha K", "email": "asha@mail.com", "role": "admin" }
//          only name changed`},{type:`heading3`,text:`PATCH formats`},{type:`paragraph`,text:'The most common format is **JSON Merge Patch** (RFC 7396, `Content-Type: application/merge-patch+json`): send a partial object, and `null` means "remove this field". For more precise operations there is **JSON Patch** (RFC 6902, `application/json-patch+json`), a list of operations.'},{type:`code`,lang:`json`,code:`// JSON Patch (RFC 6902) \u2014 explicit operations, applied in order
[
  { "op": "replace", "path": "/name", "value": "Asha K" },
  { "op": "add",     "path": "/tags/-", "value": "beta-tester" },
  { "op": "remove",  "path": "/nickname" }
]`},{type:`heading3`,text:`In Angular`},{type:`code`,lang:`typescript`,code:`// Edit-profile form that always submits every field \u2192 PUT
saveProfile(user: User) {
  return this.http.put<User>(\`/api/users/\${user.id}\`, user);
}

// Toggle a single setting \u2192 PATCH with just that field
setNewsletter(id: number, enabled: boolean) {
  return this.http.patch<User>(\`/api/users/\${id}\`, { newsletter: enabled });
}`},{type:`bullets`,items:[`**PUT**: full body, idempotent, simple server logic, but larger payloads and risk of wiping fields the client did not know about (e.g. an older client version).`,`**PATCH**: small payloads, safer when several clients edit different fields, but the server must validate partial input and merge it.`,"Some APIs allow `PUT` to create a resource at a client-chosen URL (`PUT /files/report.pdf`) — creation via PUT is also idempotent.","Concurrent edits: combine either method with `ETag` + `If-Match` headers so the server rejects stale updates with `412 Precondition Failed`."]},{type:`callout`,variant:`warning`,text:'Common pitfall: many backends implement `PUT` as a partial update. It works, but it is not what the spec says. If you call it out and explain the "missing fields get cleared" behaviour, you show you know the actual semantics.'}]},"ways-to-send-data-to-an-api":{summary:"Four places: **path params** identify the resource (`/users/42`), **query params** filter, sort or paginate (`?page=2&sort=name`), **headers** carry metadata like auth tokens, content type and correlation ids, and the **body** carries the payload being created or updated (JSON, form data, files). Pick the location by what the data means, not by convenience.",details:[{type:`paragraph`,text:`A single request can use all four. The rule of thumb: the URL path says WHICH resource, the query string says HOW you want it (a view of the collection), headers say things ABOUT the request, and the body is the DATA you are sending.`},{type:`heading3`,text:`All four in one request`},{type:`code`,lang:`text`,code:`PATCH /api/orgs/7/users/42?notify=true HTTP/1.1      \u2190 path params: orgId=7, userId=42
Host: api.example.com                                  \u2190 query param: notify=true
Authorization: Bearer eyJhbGciOi...                    \u2190 headers: auth, content type,
Content-Type: application/json                            tracing
X-Request-Id: 9f1c2b

{ "role": "editor" }                                   \u2190 body / payload`},{type:`heading3`,text:`The same request with Angular HttpClient`},{type:`code`,lang:`typescript`,code:`const orgId = 7;
const userId = 42;

this.http.patch<User>(
  \`/api/orgs/\${orgId}/users/\${userId}\`,                 // path params
  { role: 'editor' },                                     // body
  {
    params: new HttpParams().set('notify', true),          // query params \u2192 ?notify=true
    headers: new HttpHeaders({ 'X-Request-Id': crypto.randomUUID() }), // headers
  },
);
// Authorization is usually added globally by an interceptor, not per call.`},{type:`heading3`,text:`When to use which`},{type:`bullets`,items:["**Path params** — required identifiers that form the resource hierarchy: `/products/123/reviews/9`. Missing one means a different resource.",`**Query params** — optional modifiers: filters, search terms, pagination, sorting, field selection. Visible in the URL, so they are bookmarkable and cacheable, but also logged by servers and proxies.`,"**Headers** — metadata and cross-cutting concerns: `Authorization`, `Content-Type`, `Accept`, `Accept-Language`, `If-None-Match`, idempotency keys, tracing ids.","**Body** — the resource representation or command data for `POST`/`PUT`/`PATCH`: JSON, `multipart/form-data` for file uploads, `application/x-www-form-urlencoded` for classic forms.","Cookies are technically a header (`Cookie`) and are sent automatically by the browser — common for session auth."]},{type:`callout`,variant:`warning`,text:"Never put secrets (passwords, tokens, personal data) in path or query params — URLs end up in browser history, server access logs, analytics and the `Referer` header. Use headers or the body over HTTPS."}]},"body-in-a-get-request":{summary:"Not with Angular `HttpClient.get()` — its signature has no body parameter, only `url` and `options`. Browsers also refuse it: `fetch` throws a TypeError if you give a GET request a body, and `XMLHttpRequest` silently drops it. At the protocol level a GET body is not forbidden, but it has no defined meaning, so servers and proxies may ignore or reject it.",details:[{type:`paragraph`,text:`This question tests whether you know the difference between "what HTTP technically allows" and "what actually works". The short answer for a browser app is: no — send the data as query params, or use POST.`},{type:`heading3`,text:`What happens in the browser`},{type:`code`,lang:`typescript`,code:`// Angular HttpClient \u2014 there is simply no place for a body
this.http.get<User[]>('/api/users', { params: { role: 'admin' } }); // \u2705 query params only

// The generic request() method accepts a body, but the browser backend drops it
this.http.request('GET', '/api/users', { body: { role: 'admin' } });
// \u2192 request goes out WITHOUT a body (XHR ignores body for GET)

// fetch is stricter
fetch('/api/users', { method: 'GET', body: JSON.stringify({ role: 'admin' }) });
// \u274C TypeError: Request with GET/HEAD method cannot have body.`},{type:`heading3`,text:`Outside the browser`},{type:`paragraph`,text:"Server-side tools like `curl`, Postman or Node HTTP clients can send a GET with a body, and some APIs (famously Elasticsearch `_search`) accept it. But proxies, CDNs, load balancers and caches are free to strip it, and caches key on the URL only — two GETs with different bodies would return the same cached response."},{type:`bullets`,items:["Simple filters → query params: `GET /api/products?category=shoes&maxPrice=100`.","Large or deeply nested criteria → `POST /api/products/search` with a JSON body.","Elasticsearch-style APIs usually also accept `POST` for the same endpoint, which is what browser clients use."]},{type:`divider`},{type:`heading3`,text:"Follow-up: Is it recommended according to HTTP specifications (`RFC 7231`) to send a request body/payload inside an HTTP GET request? What are the standard alternatives (`POST/PUT or query parameters`)?"},{type:`paragraph`,text:'No. RFC 7231 says a payload within a GET request "has no defined semantics" and sending one may cause some implementations to reject the request; its successor RFC 9110 says clients SHOULD NOT send content in a GET unless talking directly to a server that has said it supports it. The standard alternatives are query parameters for normal filters and a `POST` (e.g. `POST /search`) for large or complex criteria.'},{type:`heading3`,text:`What the specs say`},{type:`bullets`,items:[`**RFC 7231 §4.3.1 (2014)**: a payload within a GET request message has no defined semantics; sending one might cause some existing implementations to reject the request.`,`**RFC 9110 (2022)**, which obsoletes 7231, is stricter in wording: the content of a GET has no generally defined semantics, cannot alter the meaning of the request, and clients SHOULD NOT generate it without prior knowledge that the server supports it.`,`Result: "not forbidden, but not interoperable" — treat it as unsupported.`]},{type:`heading3`,text:`Alternative 1: query parameters`},{type:`code`,lang:`typescript`,code:`// GET /api/orders?status=shipped&from=2026-01-01&page=2&size=20
const params = new HttpParams({
  fromObject: { status: 'shipped', from: '2026-01-01', page: 2, size: 20 },
});
this.http.get<Page<Order>>('/api/orders', { params });

// Arrays: repeated keys \u2192 ?tag=a&tag=b
new HttpParams().appendAll({ tag: ['a', 'b'] });`},{type:`heading3`,text:`Alternative 2: POST to a search/query resource`},{type:`code`,lang:`typescript`,code:`// Complex criteria that would make a huge or unreadable URL
const criteria = {
  filters: [{ field: 'price', op: 'between', value: [10, 50] }],
  sort: [{ field: 'rating', dir: 'desc' }],
  page: { index: 0, size: 50 },
};
this.http.post<Page<Product>>('/api/products/search', criteria);
// Downsides: not cacheable by default, not bookmarkable, not idempotent by definition`},{type:`bullets`,items:[`Use **query params** when the criteria are simple and the result should be cacheable/shareable.`,`Use **POST /search** when criteria are large (URL limits are roughly 2–8 KB depending on server/proxy), nested, or contain sensitive values you do not want in logs.`,'`PUT` is not really an alternative for reads — it means "store this representation". Mention it only to rule it out.',`Watch the IETF **QUERY** method draft: a safe, idempotent method that does carry a body. It is still a draft, so do not rely on it in production.`]},{type:`callout`,variant:`tip`,text:`Interview tip: answer in two layers — "HttpClient and browsers will not send it" and "even if a server-side client can, intermediaries may drop it, so it is not reliable". Then give the alternatives.`}]},"making-an-api-call-with-httpclient":{summary:"Register the client with `provideHttpClient()` in `app.config.ts`, `inject(HttpClient)` into a service, and call `get/post/put/patch/delete`, which return a cold `Observable` — nothing is sent until something subscribes (the `async` pipe, `subscribe()`, `toSignal()` or `httpResource()`). Keep the calls in a service and type the response with a generic, e.g. `http.get<User[]>(url)`.",details:[{type:`paragraph`,text:"`HttpClient` is Angular's wrapper around the browser's XHR (or `fetch`, if you opt in with `withFetch()`). It gives you typed responses, automatic JSON parsing, interceptors and testing utilities. The important mental model: every method returns an Observable that fires the request on subscribe and completes after one response."},{type:`heading3`,text:`1. Provide it once`},{type:`code`,lang:`typescript`,code:`// app.config.ts (standalone app)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),                              // optional: use fetch API (good for SSR)
      withInterceptors([authInterceptor]),      // optional: functional interceptors
    ),
  ],
};
// Legacy NgModule apps imported HttpClientModule \u2014 now deprecated in favour of provideHttpClient().`},{type:`heading3`,text:`2. Wrap calls in a service`},{type:`code`,lang:`typescript`,code:`export interface Product { id: number; title: string; price: number }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(category?: string): Observable<Product[]> {
    const params = category ? { category } : {};
    return this.http.get<Product[]>('/api/products', { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(\`/api/products/\${id}\`);
  }
}`},{type:`heading3`,text:`3. Consume it in a component`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-products',
  imports: [AsyncPipe, CurrencyPipe],
  template: \`
    @if (products$ | async; as products) {
      @for (p of products; track p.id) {
        <p>{{ p.title }} \u2014 {{ p.price | currency }}</p>
      }
    } @else {
      <p>Loading\u2026</p>
    }
  \`,
})
export class ProductsComponent {
  products$ = inject(ProductService).getAll(); // request fires when async pipe subscribes
}

// Signal-based alternative
// products = toSignal(inject(ProductService).getAll(), { initialValue: [] });`},{type:`flow`,title:`Life of an HttpClient call`,code:`sequenceDiagram
  participant C as Component
  participant S as Service
  participant I as Interceptors
  participant API as Backend
  C->>S: getAll()
  S-->>C: cold Observable (nothing sent yet)
  C->>I: subscribe / async pipe
  I->>API: GET /api/products (+ auth header)
  API-->>I: 200 JSON
  I-->>C: parsed Product[] then complete`},{type:`bullets`,items:["Options: `params`, `headers`, `observe: 'response'` (full `HttpResponse` with status and headers), `responseType: 'blob' | 'text'`, `reportProgress`, `context` (for interceptors).","Every subscribe sends a new request — subscribing twice means two calls. Use `shareReplay` or a signal store if several consumers need the same data.","Newer Angular versions also offer `httpResource()` — a signal-based API that refetches when the signals it reads change. Its exact API has evolved between releases, so check your version's docs.","Test with `provideHttpClientTesting()` and `HttpTestingController`."]},{type:`callout`,variant:`tip`,text:`Interview tip: say "HttpClient observables are cold and complete after one emission". It explains why you do not need to unsubscribe from a finished request in most cases, and why subscribing twice doubles the calls.`},{type:`divider`},{type:`heading3`,text:"Follow-up: How do you send a request body/payload in an HTTP POST or PUT request using Angular `HttpClient`?"},{type:`paragraph`,text:"Pass the body as the second argument: `http.post<T>(url, body, options)` / `http.put<T>(url, body, options)`. Plain objects are serialised to JSON with `Content-Type: application/json` automatically; `FormData` is sent as `multipart/form-data`, `HttpParams` as URL-encoded form data, and `Blob`/`string` as-is."},{type:`paragraph`,text:"Angular infers the content type from the type of the body you pass, so most of the time you just hand it a typed object. You only set `Content-Type` yourself for unusual formats."},{type:`heading3`,text:`JSON body (the 95% case)`},{type:`code`,lang:`typescript`,code:`interface CreateTodo { title: string; done: boolean }
interface Todo extends CreateTodo { id: number }

createTodo(body: CreateTodo) {
  // \u2192 POST /api/todos  Content-Type: application/json  {"title":"Write docs","done":false}
  return this.http.post<Todo>('/api/todos', body);
}

replaceTodo(todo: Todo) {
  // \u2192 PUT /api/todos/7  with the full object
  return this.http.put<Todo>(\`/api/todos/\${todo.id}\`, todo);
}`},{type:`heading3`,text:`Sending a Reactive Form value`},{type:`code`,lang:`typescript`,code:`form = inject(FormBuilder).nonNullable.group({
  title: ['', Validators.required],
  done: [false],
});

save() {
  if (this.form.invalid) return;
  this.todoService.createTodo(this.form.getRawValue()).subscribe({
    next: todo => this.router.navigate(['/todos', todo.id]),
    error: err => this.errorMessage.set(err.error?.message ?? 'Save failed'),
  });
}`},{type:`heading3`,text:`File upload and form-encoded bodies`},{type:`code`,lang:`typescript`,code:`// multipart/form-data \u2014 do NOT set Content-Type yourself, the browser adds the boundary
upload(file: File, description: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('description', description);
  return this.http.post<{ url: string }>('/api/uploads', fd, {
    reportProgress: true,
    observe: 'events', // emits HttpEventType.UploadProgress events
  });
}

// application/x-www-form-urlencoded \u2014 e.g. an OAuth token endpoint
login(user: string, pass: string) {
  const body = new HttpParams().set('username', user).set('password', pass).set('grant_type', 'password');
  return this.http.post<TokenResponse>('/oauth/token', body);
}`},{type:`bullets`,items:["Third argument = options: `headers`, `params`, `observe`, `responseType`, `withCredentials`, `context`.","A `Date` in the body becomes an ISO string via `JSON.stringify`; a `Map`/`Set` becomes `{}` — convert them first.",`The call is lazy: nothing is sent until you subscribe.`]},{type:`callout`,variant:`warning`,text:"Common pitfall: manually setting `Content-Type: multipart/form-data` on a FormData upload. It removes the boundary parameter the browser would add, and the server cannot parse the request."},{type:`divider`},{type:`heading3`,text:"Follow-up: Write the TypeScript code to make an HTTP POST API call sending a JSON request payload and custom headers using Angular `HttpClient`."},{type:`paragraph`,text:"Create a typed service that injects `HttpClient`, builds `HttpHeaders`, and calls `this.http.post<ResponseType>(url, payload, { headers })`. Subscribe (or use `async`/`toSignal`) to send it, and handle errors with `catchError`. Cross-cutting headers like `Authorization` are better added in an interceptor."},{type:`heading3`,text:`Complete working example`},{type:`code`,lang:`typescript`,code:`// order.service.ts
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export interface CreateOrderRequest {
  productId: number;
  quantity: number;
  shippingAddress: string;
}

export interface OrderResponse {
  orderId: string;
  status: 'PENDING' | 'CONFIRMED';
  total: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly url = 'https://api.example.com/orders';

  createOrder(payload: CreateOrderRequest): Observable<OrderResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',          // default for objects, shown for clarity
      'X-Client-Version': '2.4.0',                 // custom header
      'Idempotency-Key': crypto.randomUUID(),      // makes retries safe on the server
    });

    return this.http.post<OrderResponse>(this.url, payload, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.status === 0
          ? 'Network error \u2014 check your connection'
          : err.error?.message ?? \`Server returned \${err.status}\`;
        return throwError(() => new Error(message));
      }),
    );
  }
}`},{type:`heading3`,text:`Calling it from a component`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-checkout',
  template: \`
    <button (click)="placeOrder()" [disabled]="saving()">Place order</button>
    @if (error()) { <p class="error">{{ error() }}</p> }
  \`,
})
export class CheckoutComponent {
  private orders = inject(OrderService);
  private destroyRef = inject(DestroyRef);
  saving = signal(false);
  error = signal<string | null>(null);

  placeOrder() {
    this.saving.set(true);
    this.orders
      .createOrder({ productId: 101, quantity: 2, shippingAddress: '221B Baker St' })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => console.log('Created', res.orderId), // e.g. "Created ord_8f2a"
        error: (e: Error) => this.error.set(e.message),
      });
  }
}`},{type:`heading3`,text:`Reading response headers too`},{type:`code`,lang:`typescript`,code:`this.http
  .post<OrderResponse>(this.url, payload, { headers, observe: 'response' })
  .subscribe(res => {
    console.log(res.status);                   // 201
    console.log(res.headers.get('Location'));  // /orders/ord_8f2a
    console.log(res.body?.orderId);            // ord_8f2a
  });`},{type:`bullets`,items:["`HttpHeaders` is immutable — `headers.set(...)` returns a NEW instance, so reassign it: `headers = headers.set('X-A', '1')`.","You can also pass a plain object: `{ headers: { 'X-Client-Version': '2.4.0' } }`.","Custom headers on cross-origin requests trigger a CORS preflight; the server must list them in `Access-Control-Allow-Headers`."]},{type:`callout`,variant:`tip`,text:"Interview tip: after writing the code, mention that you would move the auth/version headers into an `HttpInterceptorFn` so every request gets them consistently — it shows you think about the codebase, not just one call."},{type:`divider`},{type:`heading3`,text:`Follow-up: Write a function to fetch data from an API such as JsonPlaceholder.`},{type:`paragraph`,text:"In plain JavaScript use `fetch` with `async/await`, check `response.ok` (fetch does not reject on 404/500), parse JSON, and handle network errors and timeouts with `try/catch` and an `AbortController`. In Angular, the same thing is a typed `HttpClient.get` in a service consumed via the `async` pipe or `toSignal`."},{type:`heading3`,text:`Vanilla JavaScript / TypeScript with fetch`},{type:`code`,lang:`typescript`,code:`interface Post { userId: number; id: number; title: string; body: string }

async function fetchPosts(limit = 5, timeoutMs = 5000): Promise<Post[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      \`https://jsonplaceholder.typicode.com/posts?_limit=\${limit}\`,
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );

    // fetch only rejects on network failure \u2014 HTTP errors must be checked manually
    if (!res.ok) {
      throw new Error(\`HTTP \${res.status} \${res.statusText}\`);
    }
    return (await res.json()) as Post[];
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(\`Request timed out after \${timeoutMs}ms\`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Usage
fetchPosts(3)
  .then(posts => console.log(posts.map(p => p.title)))
  // \u2192 ['sunt aut facere repellat\u2026', 'qui est esse', 'ea molestias quasi\u2026']
  .catch(e => console.error(e.message));`},{type:`heading3`,text:`Fetching several resources in parallel`},{type:`code`,lang:`typescript`,code:"async function fetchUserWithPosts(userId: number) {\n  const base = 'https://jsonplaceholder.typicode.com';\n  const [user, posts] = await Promise.all([\n    fetch(`${base}/users/${userId}`).then(r => r.json()),\n    fetch(`${base}/posts?userId=${userId}`).then(r => r.json()),\n  ]);\n  return { ...user, posts }; // both requests run concurrently, total time ≈ the slower one\n}"},{type:`heading3`,text:`The Angular version`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private base = 'https://jsonplaceholder.typicode.com';

  getPosts(limit = 5) {
    return this.http
      .get<Post[]>(\`\${this.base}/posts\`, { params: { _limit: limit } })
      .pipe(retry({ count: 2, delay: 500 }), timeout(5000));
  }
}

@Component({
  selector: 'app-posts',
  template: \`
    @for (post of posts(); track post.id) {
      <article><h3>{{ post.title }}</h3><p>{{ post.body }}</p></article>
    } @empty {
      <p>No posts</p>
    }
  \`,
})
export class PostsComponent {
  posts = toSignal(inject(PostService).getPosts(), { initialValue: [] });
}`},{type:`bullets`,items:[`Edge cases to mention: non-2xx status, invalid JSON, network offline, slow responses (timeout), the component being destroyed mid-request (abort / unsubscribe).`,"`HttpClient` errors DO come through the error channel for 4xx/5xx — unlike `fetch`.",`For real apps add loading and error states, not just the happy path.`]},{type:`callout`,variant:`warning`,text:"The classic mistake: assuming `fetch` rejects on a 404 or 500. It resolves normally with `res.ok === false`. Always check `res.ok` (or `res.status`) before parsing."}]},"async-pipe-vs-manual-unsubscribe":{summary:"Layer it: components never call `HttpClient` directly — they call a data service (or a store/facade) that owns URLs, typing, mapping and caching, while interceptors handle auth, errors and loading. For consumption, prefer the `async` pipe or `toSignal()` because they subscribe and unsubscribe automatically. Manual subscriptions are for side effects (submitting a form, navigation after save) and should be cleaned up with `takeUntilDestroyed()`.",details:[{type:`paragraph`,text:`Good API design in the UI is about separation of concerns: components describe what to show, services know how to get it, and cross-cutting rules live in one place. That keeps components small, testable, and lets you change an endpoint without touching templates.`},{type:`flow`,title:`Layered API access`,code:`flowchart LR
  CMP["Component<br/>signals / async pipe"]:::client --> F["Facade or Store<br/>state + caching"]:::highlight
  F --> API["Data service<br/>typed HttpClient calls"]:::server
  API --> INT["Interceptors<br/>auth, errors, retry, loading"]:::security
  INT --> BE[("Backend API")]:::external`},{type:`heading3`,text:`Reading data: async pipe or toSignal`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-user-list',
  imports: [AsyncPipe],
  template: \`
    @if (users$ | async; as users) {
      @for (u of users; track u.id) { <li>{{ u.name }}</li> }
    }
    <!-- or with a signal: @for (u of users(); track u.id) -->
  \`,
})
export class UserListComponent {
  private api = inject(UserApi);
  users$ = this.api.list();                                     // async pipe subscribes/unsubscribes
  users = toSignal(this.api.list(), { initialValue: [] });      // signal version, auto-cleanup on destroy
}`},{type:`heading3`,text:`Side effects: manual subscribe with cleanup`},{type:`code`,lang:`typescript`,code:`export class EditUserComponent {
  private api = inject(UserApi);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  save(user: User) {
    this.api.update(user.id, user)
      .pipe(takeUntilDestroyed(this.destroyRef)) // cancels if user leaves mid-request
      .subscribe(() => this.router.navigate(['/users']));
  }

  // Long-lived streams ALWAYS need cleanup:
  constructor() {
    interval(30_000)
      .pipe(switchMap(() => this.api.list()), takeUntilDestroyed())
      .subscribe(list => this.cache.set(list));
  }
}`},{type:`heading3`,text:`When do you need to unsubscribe?`},{type:`bullets`,items:[`**async pipe / toSignal** — never; Angular handles it.`,"**A single HttpClient call** — it completes after one response, so it will not leak. Still unsubscribe (via `takeUntilDestroyed`) if the callback should not run after the component is gone, e.g. navigation or setting state; unsubscribing also cancels the in-flight request.","**Infinite streams** — `interval`, `fromEvent`, `valueChanges`, router events, store selects, WebSockets, Subjects: always unsubscribe.","Old patterns you may still see: `Subscription` + `ngOnDestroy`, or a `destroy$` Subject with `takeUntil`. `takeUntilDestroyed()` replaces both."]},{type:`bullets`,items:["Expose state as `loading` / `data` / `error` so every screen handles all three.",`Map API DTOs to UI models in the service so backend renames do not ripple through templates.`,"Use `switchMap` for search/filters (cancel stale requests), `exhaustMap` for submit buttons, `shareReplay` for shared reference data."]},{type:`callout`,variant:`tip`,text:'Interview tip: the strongest answer is "declarative by default (async pipe / signals), imperative only for user-triggered side effects, and every manual subscription has a `takeUntilDestroyed`". Then explain why one-shot HTTP calls do not leak but may still run callbacks too late.'}]},"how-an-http-interceptor-works":{summary:"`HttpInterceptorFn` is a function `(req: HttpRequest, next: HttpHandlerFn) => Observable<HttpEvent>`. For outgoing requests you clone and modify `req` before calling `next(req)`; for incoming responses you pipe RxJS operators onto the Observable that `next` returns (`map`, `tap`, `catchError`, `retry`, `finalize`). Interceptors run in registration order on the way out and reverse order on the way back.",details:[{type:`paragraph`,text:"Calling `next(req)` hands the request to the next interceptor, and finally to `HttpBackend`, which actually performs the network call. Whatever you do before `next` affects the request; whatever you `pipe` after it affects the response. If you never call `next`, the request never leaves (useful for caching or mocking)."},{type:`heading3`,text:`Modifying the outgoing request`},{type:`code`,lang:`typescript`,code:`export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();          // inject() works in interceptors

  // Only attach the token to our own API, never to third-party URLs
  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // HttpRequest is immutable \u2014 clone() with the changes
  const authReq = req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  });
  return next(authReq);
};`},{type:`heading3`,text:`Inspecting the incoming response`},{type:`code`,lang:`typescript`,code:`export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  return next(req).pipe(
    tap(event => {
      // The stream emits HttpEvents: Sent, UploadProgress, ..., Response
      if (event instanceof HttpResponse) {
        console.log(req.url, event.status, \`\${Date.now() - start}ms\`);
      }
    }),
    // Transform the body \u2014 e.g. unwrap an envelope { data: ... }
    map(event =>
      event instanceof HttpResponse && event.body?.data !== undefined
        ? event.clone({ body: event.body.data })
        : event,
    ),
  );
};`},{type:`heading3`,text:`Passing per-request options with HttpContext`},{type:`code`,lang:`typescript`,code:`export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) return next(req);
  const loader = inject(LoaderService);
  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};

// Caller opts out for a background poll
this.http.get('/api/notifications', { context: new HttpContext().set(SKIP_LOADER, true) });`},{type:`flow`,title:`Request and response path`,code:`sequenceDiagram
  participant S as Service
  participant A as authInterceptor
  participant T as timingInterceptor
  participant B as HttpBackend
  S->>A: req
  A->>T: req.clone(+Authorization)
  T->>B: next(req)
  B-->>T: HttpResponse
  T-->>A: tap / map response
  A-->>S: final response`},{type:`bullets`,items:["Register: `provideHttpClient(withInterceptors([authInterceptor, timingInterceptor]))` — the array order is the request order.","Class-based equivalent: `intercept(req: HttpRequest<any>, next: HttpHandler) { return next.handle(req); }` provided via `HTTP_INTERCEPTORS` with `multi: true`.","Interceptors must return an Observable; returning `of(new HttpResponse({ body }))` short-circuits the request (cache hit or mock)."]},{type:`callout`,variant:`warning`,text:"Common pitfall: injecting `HttpClient` inside an interceptor and making a call through it (e.g. for token refresh) re-enters the same interceptor chain. Guard against loops — skip the refresh URL or use an `HttpContextToken` flag."},{type:`divider`},{type:`heading3`,text:`Follow-up: What are Interceptors?`},{type:`paragraph`,text:"Interceptors are middleware for `HttpClient`: functions that sit in a chain between your code and the network, so every request and response passes through them. They are used for cross-cutting concerns — adding auth tokens, global error handling, retries, loading spinners, logging and caching — written once instead of in every service."},{type:`heading3`,text:`A minimal interceptor`},{type:`code`,lang:`typescript`,code:`// logging.interceptor.ts
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  return next(req).pipe(
    finalize(() =>
      console.log(\`\${req.method} \${req.urlWithParams} took \${Math.round(performance.now() - started)}ms\`),
    ),
  );
};
// Console: "GET /api/users?page=1 took 142ms"

// app.config.ts
provideHttpClient(withInterceptors([loggingInterceptor]));`},{type:`heading3`,text:`Typical uses`},{type:`bullets`,items:["**Auth**: attach `Authorization: Bearer <token>`; refresh the token on 401 and replay the request.",`**Errors**: map HTTP errors to user-friendly toasts, redirect to login on 401.`,"**Loading indicator**: increment a counter on request, decrement in `finalize`.","**Base URL / API versioning**: prefix relative URLs with `environment.apiUrl`.",`**Retry & timeout** for idempotent requests.`,`**Caching** GET responses, **mocking** in development, **correlation ids** for tracing.`]},{type:`flow`,title:`Interceptors form a chain`,code:`flowchart LR
  S["Service<br/>http.get()"]:::client --> A["authInterceptor"]:::security
  A --> L["loadingInterceptor"]:::highlight
  L --> E["errorInterceptor"]:::server
  E --> B["HttpBackend"]:::network
  B --> API[("API")]:::external`,text:`Requests flow left to right in the order you register them; responses flow back right to left.`},{type:`bullets`,items:["Modern Angular: functional `HttpInterceptorFn` registered with `withInterceptors([...])`; can use `inject()` inside.","Legacy: class implementing `HttpInterceptor` registered with the `HTTP_INTERCEPTORS` multi-provider (and `withInterceptorsFromDi()` if you mix them with `provideHttpClient`).","They only see requests made via `HttpClient` — not `fetch()` calls you write yourself, or `<img>`/script loads."]}]},"interceptor-for-common-error-responses":{summary:"Write an `HttpInterceptorFn` that pipes `catchError` onto `next(req)`, switches on `error.status` (0 network, 401, 403, 404, 422, 5xx), performs the global reaction — redirect to login, show a toast, log — and then re-throws with `throwError(() => err)` so the calling code can still react. Optionally `retry` transient failures for idempotent requests first.",details:[{type:`heading3`,text:`Error-handling interceptor`},{type:`code`,lang:`typescript`,code:`// error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    // Retry transient failures, but only for safe/idempotent methods
    retry({
      count: req.method === 'GET' ? 2 : 0,
      delay: (err: HttpErrorResponse, attempt) =>
        err.status === 0 || err.status >= 500 ? timer(attempt * 500) : throwError(() => err),
    }),
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 0:
          toast.error('Network error \u2014 please check your connection.');
          break;
        case 401:
          auth.clearSession();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          break;
        case 403:
          toast.error('You do not have permission to do that.');
          break;
        case 404:
          // Often handled by the caller (e.g. show "not found" page) \u2014 no global toast
          break;
        case 422:
        case 400:
          // Validation errors: let the form display field messages
          break;
        default:
          if (err.status >= 500) toast.error('Something went wrong. Please try again later.');
      }
      console.error(\`[HTTP \${err.status}] \${req.method} \${req.url}\`, err.error);
      return throwError(() => err); // \u2705 re-throw so components can still handle it
    }),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]));`},{type:`flow`,title:`Deciding what to do with an error`,code:`flowchart TD
  E["HttpErrorResponse"]:::server --> S{"status"}
  S -->|"0 or 5xx on GET"| R["retry with backoff"]:::cache
  R -->|still failing| T["toast: try later"]:::highlight
  S -->|401| L["clear session<br/>go to login"]:::security
  S -->|403| P["toast: no permission"]:::highlight
  S -->|"400 / 422"| F["pass to form<br/>field errors"]:::client
  T --> X["rethrow to caller"]:::external
  L --> X
  P --> X
  F --> X`},{type:`heading3`,text:`Letting a caller opt out`},{type:`code`,lang:`typescript`,code:`export const SILENT_ERRORS = new HttpContextToken(() => false);

// in the interceptor, at the top of catchError:
if (req.context.get(SILENT_ERRORS)) return throwError(() => err);

// caller handles errors itself
this.http.get('/api/optional-banner', { context: new HttpContext().set(SILENT_ERRORS, true) })
  .pipe(catchError(() => of(null)));`},{type:`bullets`,items:["`err.error` holds the server body (often `{ message, errors }`); `err.status === 0` means the request never got a response (offline, CORS, DNS).","Do not retry `POST` blindly — it may duplicate an order.",`For token expiry, a refresh-and-replay flow usually lives in the auth interceptor: on 401 call refresh once, queue concurrent requests, then retry them with the new token.`,"Non-HTTP runtime errors are handled by Angular's `ErrorHandler`, not interceptors."]},{type:`callout`,variant:`warning`,text:'Common pitfall: returning `EMPTY` or `of(null)` from the global interceptor. The component then gets "success" with no data, its error branch never runs, and loading spinners may hang. Handle globally, then re-throw.'}]},"global-vs-component-level-error-handling":{summary:"Global handling (an HTTP error interceptor plus a custom `ErrorHandler`) deals with concerns that are the same everywhere — 401 redirect, offline/5xx toasts, logging to Sentry. Component-level handling (`catchError` or the `error` callback) deals with what only that screen knows — showing field validation errors, a fallback UI, or a retry button. Good apps use both: global for consistency, local for context, and the interceptor re-throws so the component can still react.",details:[{type:`heading3`,text:`The two layers`},{type:`bullets`,items:[`**HTTP interceptor (global)**: auth failures, network down, server errors, logging, generic toasts.`,"**`ErrorHandler` (global)**: uncaught runtime errors anywhere — template errors, exceptions in event handlers, unhandled promise rejections. Report them to a monitoring tool.",`**Component / service (local)**: 404 → "Product not found" panel; 422 → highlight fields; optional widget fails → hide it; offer "Retry".`]},{type:`heading3`,text:`Global: custom ErrorHandler`},{type:`code`,lang:`typescript`,code:`@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private monitoring = inject(MonitoringService);

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) return; // already handled by the interceptor
    this.monitoring.captureException(error);         // e.g. Sentry / App Insights
    console.error(error);
  }
}

// app.config.ts
providers: [
  { provide: ErrorHandler, useClass: GlobalErrorHandler },
  provideHttpClient(withInterceptors([errorInterceptor])),
]`},{type:`heading3`,text:`Local: context-specific handling`},{type:`code`,lang:`typescript`,code:`export class ProductDetailComponent {
  private api = inject(ProductService);
  id = input.required<number>();

  state = signal<{ product?: Product; notFound?: boolean; failed?: boolean }>({});

  constructor() {
    effect(() => {
      this.api.getById(this.id()).subscribe({
        next: product => this.state.set({ product }),
        error: (err: HttpErrorResponse) =>
          this.state.set(err.status === 404 ? { notFound: true } : { failed: true }),
        // interceptor already showed a toast for 5xx; here we only switch the UI
      });
    });
  }
}`},{type:`heading3`,text:`Local: recover and keep the stream alive`},{type:`code`,lang:`typescript`,code:`recommendations$ = this.api.getRecommendations().pipe(
  catchError(() => of([])), // non-critical widget \u2192 just show nothing
);`},{type:`flow`,title:`Where an error is handled`,code:`flowchart LR
  ERR["Error occurs"]:::server --> T{"Type?"}
  T -->|HTTP| INT["Error interceptor<br/>toast, 401, logging"]:::security
  INT -->|rethrow| CMP["Component catchError<br/>UI fallback"]:::client
  T -->|"Runtime exception"| EH["Global ErrorHandler<br/>report to monitoring"]:::external
  CMP -->|"not handled"| EH`},{type:`bullets`,items:["Avoid double messages: decide which layer shows the toast (e.g. a `SILENT_ERRORS` context token to let a component take over).",`Global-only is not enough: a generic "Something went wrong" toast on a form with 5 invalid fields is a poor UX.`,`Local-only is not enough: you will duplicate 401 logic and forget logging somewhere.`]},{type:`callout`,variant:`tip`,text:'Interview tip: frame it as "global for what is generic, local for what is contextual", and name all three tools — `HttpInterceptorFn`, `ErrorHandler` and `catchError` — with an example of each.'}]},"preventing-duplicate-api-requests":{summary:"It depends on where duplicates come from. For user actions use `exhaustMap` (ignore clicks while a request is running) or disable the button; for search/filter use `debounceTime` + `distinctUntilChanged` + `switchMap` (cancel stale requests); for the same data needed in many places share one request with `shareReplay` or a cached service/signal store; and for concurrent identical GETs, an interceptor can de-duplicate in-flight requests.",details:[{type:`paragraph`,text:`Duplicate requests waste bandwidth, can cause race conditions (an older response overwriting a newer one) and for non-idempotent calls can create duplicate records. Start by identifying the source, then pick the right tool.`},{type:`heading3`,text:`1. Double-clicks on submit → exhaustMap`},{type:`code`,lang:`typescript`,code:`private submit$ = new Subject<OrderForm>();

constructor() {
  this.submit$
    .pipe(
      exhaustMap(form => this.api.placeOrder(form)), // ignores new clicks until this completes
      takeUntilDestroyed(),
    )
    .subscribe(order => this.router.navigate(['/orders', order.id]));
}

onSubmit() { this.submit$.next(this.form.getRawValue()); }
// Template: also [disabled]="saving()" for visual feedback`},{type:`heading3`,text:`2. Typing / filter changes → debounce + switchMap`},{type:`code`,lang:`typescript`,code:`results$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),            // wait until typing pauses
  map(q => q.trim()),
  distinctUntilChanged(),       // same term \u2192 no new request
  switchMap(q => this.api.search(q)), // cancels the previous in-flight request
);`},{type:`heading3`,text:`3. Same data in many components → share it`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class CountryService {
  private http = inject(HttpClient);
  readonly countries$ = this.http.get<Country[]>('/api/countries').pipe(
    shareReplay({ bufferSize: 1, refCount: false }), // one request, cached for the app lifetime
  );
}`},{type:`heading3`,text:`4. Concurrent identical GETs → de-dupe interceptor`},{type:`code`,lang:`typescript`,code:`const inFlight = new Map<string, Observable<HttpEvent<unknown>>>();

export const dedupeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  const key = req.urlWithParams;
  const existing = inFlight.get(key);
  if (existing) return existing; // reuse the pending request

  const shared = next(req).pipe(
    finalize(() => inFlight.delete(key)),
    share(),
  );
  inFlight.set(key, shared);
  return shared;
};`},{type:`bullets`,items:["`switchMap` = latest wins (search), `exhaustMap` = first wins (submit), `concatMap` = queue in order (sequential saves), `mergeMap` = all in parallel.","Server side, protect non-idempotent endpoints with an `Idempotency-Key` header — the client can never fully prevent duplicates (retries, multiple tabs).","Avoid subscribing to the same HTTP observable twice in a template — use one `async` pipe with `as`, or `toSignal`.",`Resolvers + components fetching the same data is another common duplicate; pass resolved data instead of refetching.`]},{type:`callout`,variant:`tip`,text:`Interview tip: ask (or state) where the duplicates come from before answering. Naming the four operators and when each fits is what separates a strong answer from "I disable the button".`}]},"sharing-one-api-response-across-components":{summary:"Move the data into a shared singleton service (or store) that fetches once and caches the result, and let all components read from it. The simplest RxJS version is `shareReplay(1)` on the HTTP observable; the modern signal version is a service that loads into a `signal` once and exposes it read-only. For larger apps use NgRx / SignalStore, and add an invalidation strategy (TTL, manual refresh, clearing on logout).",details:[{type:`paragraph`,text:"Each subscription to an `HttpClient` observable triggers a new request, so three components calling `getUser()` means three calls. The fix is to make the data shared state rather than a per-component fetch."},{type:`heading3`,text:`Option 1: shareReplay in a service`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private profile$?: Observable<Profile>;

  getProfile(): Observable<Profile> {
    this.profile$ ??= this.http.get<Profile>('/api/me').pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.profile$; // header, sidebar and settings all get the same cached response
  }

  refresh() { this.profile$ = undefined; }   // invalidate (e.g. after edit or logout)
}`},{type:`heading3`,text:`Option 2: a signal-based store service`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private http = inject(HttpClient);
  private readonly _profile = signal<Profile | null>(null);
  private readonly _loading = signal(false);
  private loadedAt = 0;

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly displayName = computed(() => this._profile()?.name ?? 'Guest');

  load(force = false) {
    const fresh = Date.now() - this.loadedAt < 5 * 60_000; // 5-minute TTL
    if (this._loading() || (!force && fresh && this._profile())) return;
    this._loading.set(true);
    this.http.get<Profile>('/api/me')
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe(p => { this._profile.set(p); this.loadedAt = Date.now(); });
  }
}

// Any component:
store = inject(ProfileStore);
ngOnInit() { this.store.load(); }    // only the first call hits the network
// template: {{ store.displayName() }}`},{type:`flow`,title:`One request, many consumers`,code:`flowchart LR
  H["HeaderComponent"]:::client --> S["ProfileStore<br/>singleton + cache"]:::highlight
  SB["SidebarComponent"]:::client --> S
  ST["SettingsComponent"]:::client --> S
  S -->|"first load only"| API[("GET /api/me")]:::external
  S -.->|"cached signal"| H`},{type:`heading3`,text:`Other options`},{type:`bullets`,items:["**Route resolver** at a parent route: fetch once, children read it via `ActivatedRoute.data` or input binding.",`**NgRx / NgRx SignalStore**: load in an effect only if not already loaded; selectors give every component the same state.`,"**HTTP-level cache**: a caching interceptor keyed by URL, or proper `Cache-Control`/`ETag` headers so the browser cache answers.",`**Parent passes data down** via inputs when the components are in the same subtree.`]},{type:`bullets`,items:["`shareReplay` with `refCount: false` keeps the cache forever — great for reference data, but you need a way to invalidate.","If the first request errors, `shareReplay` does not cache the error — the next subscriber retries — but make sure you reset any `??=` cache too.",`Clear user-specific caches on logout, or the next user sees stale data.`]},{type:`callout`,variant:`tip`,text:`Interview tip: always mention invalidation. "Cache it with shareReplay" is half an answer; "cache it in a root service with a TTL, refresh after mutations and clear on logout" is a senior answer.`}]}};export{e as answers};