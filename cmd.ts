export async function cmd(instruction: string): Promise<{ code: number; stdout: string; stderr: string; }> {
  const [exec, ...args] = instruction.split(' ');
  const command = new Deno.Command(exec, { args });
  const { code, stdout, stderr } = await command.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  return { code, stdout: out, stderr: err };
}
export async function cmdWithStdin(instruction: string, stdin: string): Promise<{ code: number; stdout: string; stderr: string; }> {
  const [exec, ...args] = instruction.split(' ');
  const command = new Deno.Command(exec, { args, stdin: 'piped', stdout: 'piped', stderr: 'piped' });
  const process = command.spawn();
  const encoder = new TextEncoder();
  const writer = process.stdin.getWriter();
  writer.write(encoder.encode(stdin));
  writer.releaseLock();
  await process.stdin.close();
  const { code, stdout, stderr } = await process.output();

  const decoder = new TextDecoder();
  const out = decoder.decode(stdout);
  const err = decoder.decode(stderr);
  return { code, stdout: out, stderr: err };
}
