import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is a Buffer in Node.js and when would you use it?': {
    summary:
      'A `Buffer` is a fixed-length chunk of raw binary memory (a subclass of `Uint8Array`) allocated outside the V8 heap. You use it whenever you deal with bytes rather than JavaScript strings: file and socket I/O, binary protocols, images, hashing/crypto, and encoding conversions such as UTF-8 ↔ base64.',
    details: [
      {
        type: 'paragraph',
        text: 'JavaScript strings are UTF-16 text; they cannot represent arbitrary bytes. Network sockets, files and crypto all work in bytes, so Node gives you `Buffer`. Since Node 4 it is implemented as a `Uint8Array` subclass, so every Buffer is also a typed array and works with Web APIs that expect one. Its memory is allocated outside the JS heap (it shows up as `external`/`arrayBuffers` in `process.memoryUsage()`), and it cannot be resized once created.',
      },
      { type: 'heading3', text: 'Creating buffers' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// From a string (default encoding: utf8)
const a = Buffer.from('héllo');
console.log(a);          // <Buffer 68 c3 a9 6c 6c 6f>  — 6 bytes, 'é' is 2 bytes
console.log(a.length);   // 6  (bytes, not characters!)
console.log('héllo'.length); // 5

// Zero-filled, safe
const b = Buffer.alloc(16);

// Fast but NOT zeroed — may contain old memory. Only use if you overwrite every byte.
const c = Buffer.allocUnsafe(16);

// From bytes
const d = Buffer.from([0xde, 0xad, 0xbe, 0xef]);`,
      },
      { type: 'heading3', text: 'Encoding conversions and binary parsing' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const buf = Buffer.from('hello world');
buf.toString('base64');   // 'aGVsbG8gd29ybGQ='
buf.toString('hex');      // '68656c6c6f20776f726c64'
Buffer.from('aGVsbG8=', 'base64').toString(); // 'hello'

// Reading a binary header: 4-byte big-endian length + 1-byte type
const packet = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x02]);
const length = packet.readUInt32BE(0); // 256
const type = packet.readUInt8(4);      // 2

// slice/subarray share memory with the original — no copy
const view = packet.subarray(0, 4);
view[3] = 0xff;
console.log(packet[3]); // 255 — original changed too

// Combining chunks collected from a stream
const body = Buffer.concat(chunks).toString('utf8');`,
      },
      { type: 'heading3', text: 'When to use one' },
      {
        type: 'bullets',
        items: [
          '**I/O**: `fs.readFile` without an encoding, socket `data` events and HTTP request bodies give you Buffers.',
          '**Binary protocols**: parsing headers of images, database wire protocols, custom TCP framing.',
          '**Crypto**: hashes, HMACs, random bytes (`crypto.randomBytes(32)`) and `crypto.timingSafeEqual(a, b)` all use Buffers.',
          '**Encoding**: base64/hex/utf8 conversions, e.g. Basic auth headers or data URLs.',
          '**Multi-byte safety**: when concatenating text chunks, join the Buffers first (or use `StringDecoder`/`setEncoding`) so a UTF-8 character split across two chunks is not corrupted.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: '`Buffer.allocUnsafe()` can leak old memory contents (passwords, tokens) if you do not overwrite all of it, and the old `new Buffer(n)` constructor is deprecated for the same reason. Also note `subarray()`/`slice()` share memory — holding a tiny slice keeps the whole parent allocation alive.',
      },
    ],
  },

  'What are the four types of streams in Node.js?': {
    summary:
      '**Readable** (a source you read from, e.g. `fs.createReadStream`, an HTTP request), **Writable** (a destination, e.g. `fs.createWriteStream`, an HTTP response), **Duplex** (independent readable and writable sides, e.g. a TCP socket) and **Transform** (a Duplex whose output is computed from its input, e.g. `zlib.createGzip()`). All are EventEmitters that move data in chunks.',
    details: [
      {
        type: 'paragraph',
        text: 'Streams let you process data piece by piece instead of loading it all into memory. A 10 GB file can be copied with a few dozen KB of RAM because only one chunk (the `highWaterMark`: 64 KiB for file read streams and, since Node 22, for byte streams in general; 16 objects in object mode) is buffered at a time.',
      },
      { type: 'heading3', text: 'The four types at a glance' },
      {
        type: 'bullets',
        items: [
          '**Readable** — emits `data`/`end`, supports `for await...of`. Examples: `fs.createReadStream`, `http.IncomingMessage` (req on the server), `process.stdin`.',
          '**Writable** — `write()` returns `false` when its buffer is full, emits `drain` and `finish`. Examples: `fs.createWriteStream`, `http.ServerResponse`, `process.stdout`.',
          '**Duplex** — readable and writable sides are independent. Examples: `net.Socket`, a WebSocket stream.',
          '**Transform** — a Duplex where what you write is transformed and read out the other side. Examples: `zlib.createGzip()`, `crypto.createCipheriv()`, a CSV parser.',
          'Plus **object mode** (`objectMode: true`): chunks are arbitrary JS values instead of Buffers/strings.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

// Readable → Transform → Writable
await pipeline(
  createReadStream('access.log'),     // Readable
  createGzip(),                        // Transform
  createWriteStream('access.log.gz'),  // Writable
);

// Duplex: a TCP socket — you write to it AND read from it
import net from 'node:net';
net.createServer((socket) => {
  socket.pipe(socket); // echo server: readable side piped into writable side
}).listen(4000);`,
      },
      { type: 'heading3', text: 'Implementing each type' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { Readable, Writable, Transform } from 'node:stream';

// Readable from any iterable / async iterable
const numbers = Readable.from([1, 2, 3]);       // object mode by default

// Writable
const logger = new Writable({
  objectMode: true,
  write(chunk, _enc, cb) { console.log('got', chunk); cb(); },
});

// Transform
const double = new Transform({
  objectMode: true,
  transform(n, _enc, cb) { cb(null, n * 2); },
});

numbers.pipe(double).pipe(logger); // got 2, got 4, got 6`,
      },
      {
        type: 'flow',
        title: 'How the four types fit together',
        code: `flowchart LR
  R["Readable<br/>file, req, stdin"]:::client --> T["Transform<br/>gzip, cipher, parser"]:::highlight
  T --> W["Writable<br/>file, res, stdout"]:::db
  D["Duplex<br/>TCP socket"]:::network <--> P["Remote peer"]:::external`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interviewers often follow up with "Duplex vs Transform": in a Duplex the two sides are unrelated (what you write to a socket is not what you read back), while a Transform\'s output is derived from its input.',
      },
    ],
  },

  'What is backpressure and how does Node.js handle it?': {
    summary:
      'Backpressure is what happens when a producer generates data faster than a consumer can handle it. Node handles it with buffers bounded by `highWaterMark`: `writable.write()` returns `false` when the buffer is full, the producer should pause until the `drain` event, and `pipe()`/`pipeline()` do this pause/resume for you automatically.',
    details: [
      {
        type: 'paragraph',
        text: 'Imagine reading from a fast SSD and uploading to a slow network. Without flow control, every chunk read would pile up in memory waiting to be sent, and the process eventually runs out of memory. Streams signal "slow down" back up the chain — that signal is backpressure.',
      },
      { type: 'heading3', text: 'The mechanism' },
      {
        type: 'numbered',
        items: [
          'Every Writable has an internal buffer and a `highWaterMark` (a threshold, not a hard limit).',
          '`write(chunk)` adds to the buffer and returns `false` once the buffered size reaches `highWaterMark`.',
          'A well-behaved producer stops writing (or pauses the Readable) when it sees `false`.',
          'When the buffer drains, the Writable emits `drain`, and the producer resumes.',
          'On the Readable side, data is only pulled from the underlying source when its own buffer is below `highWaterMark`.',
        ],
      },
      { type: 'heading3', text: 'Ignoring backpressure (bug) vs handling it' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

const out = createWriteStream('big.txt');

// ❌ BAD: ignores the return value — memory grows unbounded for 10M lines
for (let i = 0; i < 10_000_000; i++) {
  out.write(\`line \${i}\\n\`);
}

// ✅ GOOD: respect write() and wait for 'drain'
async function writeLines() {
  for (let i = 0; i < 10_000_000; i++) {
    if (!out.write(\`line \${i}\\n\`)) {
      await once(out, 'drain'); // pause until the buffer empties
    }
  }
  out.end();
}`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ✅ BEST: let pipeline() manage backpressure end-to-end
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

async function* lines() {
  for (let i = 0; i < 10_000_000; i++) yield \`line \${i}\\n\`;
}

await pipeline(Readable.from(lines()), createWriteStream('big.txt'));
// The generator is only advanced when the file stream can accept more data`,
      },
      {
        type: 'flow',
        title: 'Backpressure signal',
        code: `sequenceDiagram
  participant R as Readable (fast)
  participant W as Writable (slow)
  R->>W: write(chunk)
  W-->>R: true (buffer below highWaterMark)
  R->>W: write(chunk)
  W-->>R: false (buffer full)
  Note over R: pause() — stop reading
  W-->>R: 'drain' event
  Note over R: resume() — continue`,
      },
      {
        type: 'bullets',
        items: [
          '`highWaterMark` defaults: 64 KiB for byte streams in Node 22+ (16 KiB in older versions), 64 KiB for `fs.createReadStream`, 16 objects in object mode. You can tune it per stream.',
          'In HTTP: `res.write()` returning `false` means the client is slow; keep pushing and you buffer the whole response in RAM.',
          'In a custom Readable, `this.push()` returning `false` means stop producing until `_read()` is called again.',
          'Async iteration (`for await (const chunk of readable)`) naturally applies backpressure: the next chunk is not pulled until your loop body finishes.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Listening to `data` events and doing async work inside the handler (e.g. `await db.insert(chunk)`) does NOT pause the stream — `data` keeps firing. Use `for await...of`, `pipeline()` with a Writable/Transform, or explicitly `pause()`/`resume()`.',
      },
    ],
  },

  'What is stream.pipeline() and why is it preferred over .pipe()?': {
    summary:
      '`stream.pipeline()` connects a chain of streams, forwards backpressure, and — unlike `.pipe()` — propagates errors from any stage, destroys every stream in the chain on failure or completion, and gives you a single callback/promise for "done or failed". `.pipe()` does not forward errors and can leave file descriptors and sockets open, leaking resources.',
    details: [
      {
        type: 'paragraph',
        text: '`.pipe()` handles backpressure but nothing else. If the source errors, the destination is not closed; if the destination errors, the source keeps reading. You must attach an `error` handler to every stream manually, and an unhandled stream `error` crashes the process. `pipeline()` (Node 10+) and its promise version from `node:stream/promises` (Node 15+) fix this.',
      },
      { type: 'heading3', text: 'The .pipe() problem' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';

// ❌ Errors are NOT forwarded down the chain
createReadStream('missing.txt')       // emits 'error' (ENOENT)
  .pipe(createGzip())                 // never told about the error
  .pipe(createWriteStream('out.gz')) // left open — fd leak
  .on('error', console.error);        // only catches errors from the LAST stream

// The ENOENT from the first stream is unhandled → process crashes`,
      },
      { type: 'heading3', text: 'The pipeline() fix' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { pipeline } from 'node:stream/promises';

try {
  await pipeline(
    createReadStream('missing.txt'),
    createGzip(),
    createWriteStream('out.gz'),
  );
  console.log('done');
} catch (err) {
  // Any stage's error lands here; ALL streams have been destroyed
  console.error('pipeline failed:', err.code); // ENOENT
}`,
      },
      { type: 'heading3', text: 'Extras: async generators, cancellation, HTTP' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { pipeline } from 'node:stream/promises';

// Async generator functions can be stages (they receive the previous source)
await pipeline(
  createReadStream('data.txt', 'utf8'),
  async function* (source) {
    for await (const chunk of source) yield chunk.toUpperCase();
  },
  createWriteStream('upper.txt'),
);

// Cancellation with AbortSignal
const ac = new AbortController();
setTimeout(() => ac.abort(), 5_000);
await pipeline(src, transform, dest, { signal: ac.signal }); // rejects with AbortError

// HTTP: if the client disconnects, the file stream is destroyed too
http.createServer(async (req, res) => {
  try {
    await pipeline(createReadStream('video.mp4'), res);
  } catch (err) {
    // ERR_STREAM_PREMATURE_CLOSE when the client aborts — log, don't crash
  }
});`,
      },
      {
        type: 'bullets',
        items: [
          '**Error propagation**: one error destroys every stream and rejects once.',
          '**Cleanup**: file descriptors and sockets are closed — no leaks on failure or client disconnect.',
          '**Completion**: resolves only when the last stream has fully finished (`finish`/`close`).',
          '**Composability**: accepts async iterables and generator functions as stages.',
          'Related helper: `stream.finished(stream)` waits for a single stream to end or error.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'A concise interview line: "`.pipe()` gives you backpressure; `pipeline()` gives you backpressure plus error handling and cleanup. In new code I always use `await pipeline()` from `node:stream/promises`."',
      },
    ],
  },

  'How do you create a custom Transform stream?': {
    summary:
      'Either extend `stream.Transform` and implement `_transform(chunk, encoding, callback)` (plus optional `_flush(callback)` for end-of-stream output), or pass `transform`/`flush` functions to `new Transform({...})`. Call `this.push(data)` or `callback(null, data)` to emit output, and `callback(err)` to fail. In modern code an async generator in `pipeline()` is often simpler.',
    details: [
      {
        type: 'paragraph',
        text: 'A Transform receives chunks on its writable side and pushes zero, one or many chunks out of its readable side. Node handles buffering and backpressure; you only write the per-chunk logic. Remember chunk boundaries are arbitrary — a line or JSON object can be split across two chunks, so stateful transforms keep a remainder buffer.',
      },
      { type: 'heading3', text: 'Example 1: simple constructor form' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { Transform } from 'node:stream';

const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase()); // push one output chunk
  },
});

process.stdin.pipe(upperCase).pipe(process.stdout);
// echo "hello" | node upper.js  →  HELLO`,
      },
      { type: 'heading3', text: 'Example 2: class form with state and _flush (line splitter)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Transform, TransformCallback } from 'node:stream';

export class LineSplitter extends Transform {
  private remainder = '';

  constructor() {
    super({ readableObjectMode: true }); // bytes in, strings (lines) out
  }

  override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
    const data = this.remainder + chunk.toString('utf8');
    const lines = data.split('\\n');
    this.remainder = lines.pop() ?? ''; // last piece may be incomplete
    for (const line of lines) {
      if (line) this.push(line);        // emit many outputs per input chunk
    }
    cb();
  }

  override _flush(cb: TransformCallback) {
    if (this.remainder) this.push(this.remainder); // emit the trailing line
    cb();
  }
}`,
      },
      { type: 'heading3', text: 'Example 3: object-mode filter + error handling' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const parseJson = new Transform({
  objectMode: true,
  transform(line, _enc, cb) {
    try {
      const obj = JSON.parse(line);
      if (obj.level === 'error') this.push(obj); // filter: push 0 or 1
      cb();
    } catch (err) {
      cb(err); // destroys the stream; pipeline() rejects with this error
    }
  },
});

await pipeline(createReadStream('app.log'), new LineSplitter(), parseJson, sink);`,
      },
      { type: 'heading3', text: 'Modern alternative: async generator stage' },
      {
        type: 'code',
        lang: 'javascript',
        code: `await pipeline(
  createReadStream('app.log'),
  new LineSplitter(),
  async function* (lines) {
    for await (const line of lines) {
      const obj = JSON.parse(line);
      if (obj.level === 'error') yield JSON.stringify(obj) + '\\n';
    }
  },
  createWriteStream('errors.ndjson'),
);`,
      },
      {
        type: 'bullets',
        items: [
          'Always call the callback exactly once per chunk — forgetting it stalls the stream forever.',
          'Use `objectMode`, or `readableObjectMode`/`writableObjectMode` separately, when chunks are not bytes.',
          'Respect backpressure for big outputs: if `this.push()` returns `false`, you can still finish the current chunk but avoid generating huge amounts.',
          'Async work inside `_transform` is fine — just call `cb` when the promise settles.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'The most common bug is assuming one chunk = one line/record. Chunks are split at arbitrary byte boundaries (even mid UTF-8 character), so buffer the remainder and handle it in `_flush`.',
      },
    ],
  },

  'How would you process a large CSV file efficiently in Node.js?': {
    summary:
      'Stream it: `fs.createReadStream` → a streaming CSV parser (e.g. `csv-parse` or `fast-csv`) → a transform/batching step → the destination, all wired with `pipeline()` so memory stays constant and backpressure is respected. Insert into the database in batches (e.g. 500–5,000 rows per bulk insert or `COPY`), and handle bad rows without aborting the whole job.',
    details: [
      {
        type: 'paragraph',
        text: "`fs.readFile` + `split('\\n')` loads the whole file into memory (and a string can be at most ~512 MB–1 GB depending on V8), so a multi-GB CSV crashes the process. Streaming keeps only a few chunks in memory at a time, and naive `split(',')` also breaks on quoted fields containing commas or newlines — use a real parser.",
      },
      { type: 'heading3', text: 'Streaming parse with batched inserts' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { parse } from 'csv-parse';

const BATCH_SIZE = 1000;

async function importCsv(path, db) {
  let batch = [];
  let total = 0;
  let failed = 0;

  await pipeline(
    createReadStream(path),
    parse({ columns: true, skip_empty_lines: true, trim: true }), // rows as objects
    async function* (rows) {
      for await (const row of rows) {
        const record = validate(row);
        if (!record) { failed++; continue; }   // log bad row, don't abort
        batch.push(record);
        if (batch.length >= BATCH_SIZE) {
          await db.insertMany(batch);           // awaiting = natural backpressure
          total += batch.length;
          batch = [];
        }
      }
      if (batch.length) {                       // final partial batch
        await db.insertMany(batch);
        total += batch.length;
      }
    },
  );

  return { total, failed };
}`,
      },
      { type: 'heading3', text: 'Without dependencies: readline for simple CSVs' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createReadStream } from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: createReadStream('sales.csv'),
  crlfDelay: Infinity, // treat \\r\\n as one line break
});

let header;
let sum = 0;
for await (const line of rl) {
  if (!header) { header = line.split(','); continue; }
  const [, , amount] = line.split(','); // only safe if fields never contain commas/quotes
  sum += Number(amount);
}
console.log('Total sales:', sum);`,
      },
      {
        type: 'flow',
        title: 'Streaming CSV import',
        code: `flowchart LR
  F["CSV file<br/>(10 GB)"]:::db --> RS["createReadStream<br/>64 KiB chunks"]:::client
  RS --> P["csv-parse<br/>rows as objects"]:::server
  P --> V["validate +<br/>transform"]:::highlight
  V --> B["batch<br/>1000 rows"]:::queue
  B --> DB[("Database<br/>bulk insert / COPY")]:::db
  V -.->|bad rows| E["error log /<br/>dead-letter file"]:::external`,
      },
      { type: 'heading3', text: 'Making it production-grade' },
      {
        type: 'bullets',
        items: [
          '**Bulk loading**: PostgreSQL `COPY FROM STDIN` (e.g. via `pg-copy-streams`) is far faster than row inserts; MongoDB `insertMany({ ordered: false })`.',
          '**Parallelism**: CPU-heavy per-row work can go to `worker_threads`; I/O-bound DB writes can run a few batches concurrently with a limit (e.g. `p-limit`).',
          '**Resumability**: record the last processed line/byte offset so a crash can resume rather than restart.',
          '**Idempotency**: upsert on a natural key so re-running the job does not duplicate data.',
          '**Uploads**: for user uploads, stream the request body straight into the parser (or to S3 first, then process in a background job) — never buffer the file in memory.',
          '**Progress**: track bytes read vs `fs.stat().size` for a progress bar or job status.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Mention the trade-off: for a one-off 50 MB file, reading it whole is fine and simpler. Streaming matters when file size is unbounded or the process serves other requests — that judgement is what interviewers look for.',
      },
    ],
  },
};
