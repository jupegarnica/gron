import { gron } from "./main.ts";

const args = Deno.args;


const input = args[0];

if (import.meta.main) {
    const generator = await gron(input);
    for (const line of generator) {
        console.log(line);
    }
}