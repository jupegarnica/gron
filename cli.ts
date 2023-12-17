import { gron, ungron } from "./main.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

if (import.meta.main) {
    const args = parseArgs(Deno.args);
    const input = String(args._[0]);

    if (args.ungron) {
        await ungron();
    } else {
        await gron(input);
    }
}
Deno.exit(0)
