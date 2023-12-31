import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { assignValue, extractKeys, gronRaw, isValidKey, ungronRaw } from "./main.ts";
import { cmd, cmdWithStdin } from "./cmd.ts";
const gron = 'deno run --allow-read --allow-net ./cli.ts'

Deno.test('gron a object', function () {
  const generator = gronRaw(`{"a": 1, "b": 2}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, "json.a = 1;");
  const third = generator.next();
  assertEquals(third.value, "json.b = 2;");
});

Deno.test('gron a array', function () {
  const generator = gronRaw(`[1, 2, 3]`);
  const first = generator.next();
  assertEquals(first.value, "json = [];");
  const second = generator.next();
  assertEquals(second.value, "json[0] = 1;");
  const third = generator.next();
  assertEquals(third.value, "json[1] = 2;");
  const fourth = generator.next();
  assertEquals(fourth.value, "json[2] = 3;");
});

Deno.test('gron a null', function () {
  const generator = gronRaw(`null`);
  const first = generator.next();
  assertEquals(first.value, "json = null;");
});

Deno.test('gron a boolean', function () {
  const generator = gronRaw(`true`);
  const first = generator.next();
  assertEquals(first.value, "json = true;");
});

Deno.test('gron a number', function () {
  const generator = gronRaw(`1`);
  const first = generator.next();
  assertEquals(first.value, "json = 1;");
});

Deno.test('gron a string', function () {
  const generator = gronRaw(`"hello"`);
  const first = generator.next();
  assertEquals(first.value, "json = \"hello\";");
});

Deno.test('gron a nested object', function () {
  const generator = gronRaw(`{"a": {"b": 1}}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, "json.a = {};");
  const third = generator.next();
  assertEquals(third.value, "json.a.b = 1;");
});

Deno.test('gron a mixed nested object', function () {
  const generator = gronRaw(`{"a": [{"b":1}, 33], "c": true}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, "json.a = [];");
  const third = generator.next();
  assertEquals(third.value, "json.a[0] = {};");
  const fourth = generator.next();
  assertEquals(fourth.value, "json.a[0].b = 1;");
  const fifth = generator.next();
  assertEquals(fifth.value, "json.a[1] = 33;");
  const sixth = generator.next();
  assertEquals(sixth.value, "json.c = true;");

});

Deno.test('gron a empty array', function () {
  const arr = [];
  arr[0] = 1;
  arr[2] = 2;
  const generator = gronRaw(JSON.stringify(arr));
  const first = generator.next();
  assertEquals(first.value, "json = [];");
  const second = generator.next();
  assertEquals(second.value, "json[0] = 1;");
  const third = generator.next();
  assertEquals(third.value, "json[1] = null;");
  const fourth = generator.next();
  assertEquals(fourth.value, "json[2] = 2;");
});


Deno.test('[isValidKey] valid key', function () {
  assertEquals(isValidKey('hola'), true);
  assertEquals(isValidKey('a.b'), false);
  assertEquals(isValidKey('a3'), true);
  assertEquals(isValidKey('3a'), false);
  assertEquals(isValidKey('3'), false);
  assertEquals(isValidKey('$'), true);
  assertEquals(isValidKey('_'), true);
  assertEquals(isValidKey('camelCase'), true);
  assertEquals(isValidKey('PascalCase'), true);
  assertEquals(isValidKey('snake_case'), true);
  assertEquals(isValidKey('kebab-case'), false);
  assertEquals(isValidKey('!@#$%^&*'), false);
})

Deno.test('test not valid dot keys', function () {
  const generator = gronRaw(`{"a.b": 1, "content-type": 1, "3d": 1}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, `json["a.b"] = 1;`);
  const third = generator.next();
  assertEquals(third.value, `json["content-type"] = 1;`);
  const fourth = generator.next();
  assertEquals(fourth.value, `json["3d"] = 1;`);
});



// ungron
Deno.test('[ungron] extractKeys', function () {

  assertEquals(extractKeys('json.a'), ['a']);
  assertEquals(extractKeys('json["a-c"]'), ["a-c"]);
  assertEquals(extractKeys('json["a.c"]'), ["a.c"]);
  assertEquals(extractKeys('json[0]'), [0]);
  assertEquals(extractKeys('json[0][1]'), [0, 1]);
  assertEquals(extractKeys('json.a.b.c'), ['a', 'b', 'c']);
  assertEquals(extractKeys('json.a["b"].c'), ['a', 'b', 'c']);
  assertEquals(extractKeys('json.a["b"]["c"]'), ['a', 'b', 'c']);

})


Deno.test('[ungron] assignValue', function () {

  let data = {}
  assignValue(data, ['a'], '1')
  assertEquals(data, { a: 1 });

  assignValue(data, ['b'], '[]');
  assertEquals(data, { a: 1, b: [] });

  assignValue(data, ['b', 0], '"1"');
  assertEquals(data, { a: 1, b: ["1"] });

  assignValue(data, ['b', 1], '{}');
  assertEquals(data, { a: 1, b: ["1", {}] });

  assignValue(data, ['b', 1, 'c'], '1');
  assertEquals(data, { a: 1, b: ["1", { c: 1 }] });

  assignValue(data, ['c', 'content-type'], '"application/json"');
  assertEquals(data, { a: 1, b: ["1", { c: 1 }], c: { 'content-type': 'application/json' } });

  const arr: unknown[] = [];
  assignValue(arr, [1, 'c'], '0');
  assertEquals(arr, [/* empty , not undefined nor null */,{ c: 0 }]);


})


Deno.test('[ungron] ungronRaw', () => {
  const input =
    `json = {};
json.a = [];
json.a[0] = 1;
json.a[1] = "2";
`

  const output = ungronRaw(input);

  const expected =
    `{
  "a": [
    1,
    "2"
  ]
}`
  assertEquals(output, expected);
})


Deno.test('[ungron] ungronRaw complex', () => {
  const input =
    `json = {};
json.a = [];
json.a[0] = 1;
json.a[1] = "2";
json.b = {};
json.b["content-type"] = "application/json";
json.b["3d"] = 1;
json.b["a.b"] = 1;
`;


  const output = ungronRaw(input);

  const expected =
    `{
  "a": [
    1,
    "2"
  ],
  "b": {
    "content-type": "application/json",
    "3d": 1,
    "a.b": 1
  }
}`
  assertEquals(output, expected);
})


// e2e
Deno.test('[e2e] --ungron', async () => {

  const stdin =
    `json = {};
json.a = 1;`;
  const { stdout } = await cmdWithStdin(`${gron} --ungron`, stdin);
  let out =
    `{
  "a": 1
}
`;
  assertEquals(stdout, out);

});

Deno.test('[e2e] gron from stdin', async () => {
  let stdin =
    `{
  "a": 1
}
`;
  const { stdout } = await cmdWithStdin(`${gron}`, stdin);
  const out =
    `json = {};
json.a = 1;
`;

assertEquals(stdout, out);
});

Deno.test('[e2e] read from disk', async function () {

  const { stdout } = await cmd(`${gron} fixtures/obj.json`);
  let out =
    `json = {};
json.a = 1;
`
  assertEquals(stdout, out)

});


Deno.test('[e2e] read from disk file protocol', async function () {

  const { stdout } = await cmd(`${gron} file://./fixtures/obj.json`);
  let out =
    `json = {};
json.a = 1;
`
  assertEquals(stdout, out)

});

Deno.test('[e2e] fetch json', async function () {

  const server = await Deno.serve({ port: 8080, onListen() { } }, () => new Response(`{"b":1}`),)
  const { stdout } = await cmd(`${gron} http://localhost:8080`);
  await server.shutdown()
  await server.finished;
  let out =
    `json = {};
json.b = 1;
`
  assertEquals(stdout, out);
});


Deno.test('[e2e] gron and ungron must be equal', async () => {
  const { stdout: stdin } = await cmd(`${gron} fixtures/obj.json`);
  const { stdout } = await cmdWithStdin(`${gron} --ungron`, stdin);
  let out =
    `{
  "a": 1
}
`;
  assertEquals(stdout, out);

});


Deno.test('[e2e] gron | grep | ungron ', async () => {
  // gron fixtures/nested.json | grep c | gron -u
  const { stdout: in1 } = await cmd(`${gron} fixtures/nested.json`);
  const { stdout: in2 } = await cmdWithStdin(`grep c`, in1);
  const { stdout, code } = await cmdWithStdin(`${gron} -u`, in2);

  let out =
    `[
  {
    "c": 0
  },
  null,
  {
    "c": 2
  },
  {
    "nested": {
      "b": [
        null,
        null,
        {
          "c": 14
        }
      ]
    }
  }
]
`;
  assertEquals(code, 0);
  assertEquals(stdout, out);

});

Deno.test('[e2e] exit code 0', async () => {
  const { code, stderr } = await cmd(`${gron} fixtures/obj.json`);
  assertEquals(code, 0);
  assertStringIncludes(stderr, '');
});

Deno.test('[e2e] exit code 1', async () => {
  const { code, stderr } = await cmd(`${gron} fixtures/404.json`);
  assertStringIncludes(stderr, 'Failed to read file:');
  assertEquals(code, 1);
});

Deno.test('[e2e] exit code 2', async () => {
  const { code, stderr } = await cmd(`${gron} fixtures/invalid.json`);
  assertStringIncludes(stderr, 'Failed to parse JSON:');
  assertEquals(code, 2);
});


Deno.test('[e2e] exit code 4', async () => {
  const { code, stderr } = await cmd(`${gron} http://localhost:3579`);
  assertStringIncludes(stderr, 'Failed to fetch URL:');
  assertEquals(code, 4);
});
