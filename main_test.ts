import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { gron } from "./main.ts";

Deno.test('gron a object',function () {
  const generator = gron(`{"a": 1, "b": 2}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, "json.a = 1;");
  const third = generator.next();
  assertEquals(third.value, "json.b = 2;");
});

Deno.test('gron a array',function () {
  const generator = gron(`[1, 2, 3]`);
  const first = generator.next();
  assertEquals(first.value, "json = [];");
  const second = generator.next();
  assertEquals(second.value, "json[0] = 1;");
  const third = generator.next();
  assertEquals(third.value, "json[1] = 2;");
  const fourth = generator.next();
  assertEquals(fourth.value, "json[2] = 3;");
});

Deno.test('gron a null',function () {
  const generator = gron(`null`);
  const first = generator.next();
  assertEquals(first.value, "json = null;");
});

Deno.test('gron a boolean',function () {
  const generator = gron(`true`);
  const first = generator.next();
  assertEquals(first.value, "json = true;");
});

Deno.test('gron a number',function () {
  const generator = gron(`1`);
  const first = generator.next();
  assertEquals(first.value, "json = 1;");
});




Deno.test('gron a string',function () {
  const generator = gron(`"hello"`);
  const first = generator.next();
  assertEquals(first.value, "json = \"hello\";");
});

Deno.test('gron a nested object',function () {
  const generator = gron(`{"a": {"b": 1}}`);
  const first = generator.next();
  assertEquals(first.value, "json = {};");
  const second = generator.next();
  assertEquals(second.value, "json.a = {};");
  const third = generator.next();
  assertEquals(third.value, "json.a.b = 1;");
});

// mixed data types nested
Deno.test('gron a mixed nested object',function () {
  const generator = gron(`{"a": [{"b":1}, 33], "c": true}`);
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

Deno.test('gron a empty array',function () {
  const arr = [];
  arr[0] = 1;
  arr[2] = 2;
  const generator = gron(JSON.stringify(arr));
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
//   const generator = gron(`1n`);
//   const first = generator.next();
//   assertEquals(first.value, "json = 1;");
// });

// Deno.test('gron a undefined',function () {
//   const generator = gron(`undefined`);
//   const first = generator.next();
//   assertEquals(first.value, "json = undefined;");
// });

// Deno.test('gron a symbol',function () {
//   const generator = gron(`Symbol("foo")`);
//   const first = generator.next();
//   assertEquals(first.value, "json = Symbol(\"foo\");");
// });

// Deno.test('gron a function',function () {
//   const generator = gron(`function foo() {}`);
//   const first = generator.next();
//   assertEquals(first.value, "json = function foo() {};");
// });