import { gron, ungron } from "./main.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

if (import.meta.main) {
    const args = parseArgs(Deno.args, {
        boolean: ['ungron', 'help'],
        alias: {
            ungron: ['u'],
            help: ['h']
        },
        default: {
            ungron: false
        }
    });
    const path = args._[0];
    const input = args._[0] ? String(path) : '';
    try {
        if (args.help) {
            console.log(`
Usage: gron [options] [path]

Options:
    -u, --ungron    ungron
    -h, --help      display help

Examples:
    gron example.json
    cat example.json | gron
    gron https://httpbin.org/json

    gron example.json | grep surname | gron --ungron
`);
            Deno.exit(0);
        }

        if (args.ungron) {
            await ungron();
        } else {
            await gron(input.trim());
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
