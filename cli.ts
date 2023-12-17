import { gron, ungron } from "./main.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

if (import.meta.main) {
    const args = parseArgs(Deno.args);
    const input = String(args._[0]);
    try {

        if (args.ungron) {
            await ungron();
        } else {
            await gron(input);
        }
        Deno.exit(0)
    } catch (error) {
        const msg = error.message;
        console.error(msg);
        if (msg.includes('Failed to parse JSON:')) {
            Deno.exit(2);
        }
        if (msg.includes('Failed to fetch URL:')) {
            Deno.exit(4);
        }

        if (msg.includes('Failed to read file:')) {
            Deno.exit(1);
        }
        Deno.exit(9);

    }
}
