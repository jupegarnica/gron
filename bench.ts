import { assertEquals } from "https://deno.land/std@0.209.0/assert/assert_equals.ts";
import { cmd } from "./cmd.ts";

const gron = 'deno run -A cli.ts'


Deno.bench('[e2e] gron 1e3.json', async function () {
    const { code } = await cmd(`${gron} fixtures/1e3.json`);
    assertEquals(code, 0)
});