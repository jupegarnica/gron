import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { gronRaw } from "./main.ts";

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

// mixed data types nested
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

// test invalid json types: bigint, undefined, symbol, function

// Deno.test('gron a bigint',function () {
//   const generator = gronRaw(`1n`);
//   const first = generator.next();
//   assertEquals(first.value, "json = 1;");
// });

// Deno.test('gron a undefined',function () {
//   const generator = gronRaw(`undefined`);
//   const first = generator.next();
//   assertEquals(first.value, "json = undefined;");
// });

// Deno.test('gron a symbol',function () {
//   const generator = gronRaw(`Symbol("foo")`);
//   const first = generator.next();
//   assertEquals(first.value, "json = Symbol(\"foo\");");
// });

// Deno.test('gron a function',function () {
//   const generator = gronRaw(`function foo() {}`);
//   const first = generator.next();
//   assertEquals(first.value, "json = function foo() {};");
// });


async function cmd(instruction: string): Promise<{ code: number, stdout: string, stderr: string }> {
  const [exec, ...args] = instruction.split(' ');
  const command = new Deno.Command(exec, { args });
  const { code, stdout, stderr } = await command.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  return { code, stdout: out, stderr: err };
}

Deno.test('[e2e] read from disk', async function () {

  const { stdout } = await cmd(`deno run -A cli.ts fixtures/obj.json`);
  let out =
    `json = {};
json.a = 1;
`
  assertEquals(stdout, out)

});

Deno.test('[e2e] fetch json', async function () {
  const server = Deno.serve({ port: 8080, onListen(){} }, () => new Response(`{"b":1}`),)
  const { stdout } = await cmd(`deno run -A cli.ts http://localhost:8080`);
  await server.shutdown()
  let out =
    `json = {};
json.b = 1;
`
  assertEquals(stdout, out)
})