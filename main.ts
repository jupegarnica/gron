import { validKeyNameRegExp } from "./valid_key_name_regexp.ts";


type Gron = Generator<string, void, unknown>;

export async function gron(path: string): Promise<void> {
  const json = await getJson(path);

  const generator = gronRaw(json);
  for (const line of generator) {
    console.log(line);
  }
}

export function gronRaw(json: string): Gron {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new Error("Failed to parse JSON: " + error + "\n");
  }
  return gronUnknown(data);
}

async function getJson(path: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(path);
  } catch (error) {
    return await readTextFile(path);
  }
  if (url.protocol === 'file:') {
    const  _path = url.host + url.pathname;
    return await readTextFile(_path);
  }

  try {
    return await fetch(url).then((res) => res.text());
  } catch (error) {
    throw new Error("Failed to fetch URL: " + url + "\n" + error + "\n");
  }
}

async function readTextFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    throw new Error("Failed to read file: " + path + "\n" + error + "\n");
  }
}



function* gronUnknown(data: unknown, path: string = 'json'): Gron {
  const type = whichType(data);

  switch (type) {
    case 'object':
      yield* gronObject(data as Record<string, unknown>, path);

      break;
    case 'array':
      yield* gronArray(data as unknown[], path);
      break;

    case 'null':
      yield `${path} = null;`;
      break;

    case 'string':
      yield `${path} = "${data}";`;
      break;
    default:
      yield `${path} = ${String(data)};`;
      break;
  }
}

function* gronObject(data: Record<string, unknown>, path: string): Gron {
  yield `${path} = {};`;
  for (const key in data) {
    yield* gronUnknown(data[key], createNextPath(path, key));
  }
}

function* gronArray(data: unknown[], path: string): Gron {
  yield `${path} = [];`;
  for (const key in data) {
    yield* gronUnknown(data[key], `${path}[${key}]`);
  }
}

export function isValidKey(key: string): boolean {
  return !!key.match(validKeyNameRegExp);
}

function createNextPath(path: string, key: string): string {

  if (isValidKey(key)) {
    return `${path}.${key}`;
  }
  return `${path}["${key}"]`;
}

function whichType(data: unknown): string {
  if (Array.isArray(data)) {
    return "array";
  }
  if (data === null || data === undefined) {
    return "null";
  }
  if (typeof data === "object") {
    return "object";
  }
  return typeof data;
};

function whichStringType(data: string): string {
  if (data === 'null') {
    return 'null';
  }
  if (data === 'true' || data === 'false') {
    return 'boolean';
  }
  if (data === '{}') {
    return 'object';
  }
  if (data === '[]') {
    return 'array';
  }
  if (data.match(/^".*"$/)) {
    return 'string';
  }
  return 'number';
}
function prepareValue(value: string): string {
  return value.replace(/;\s{0,}$/, '').trim();
}

function returnValue(data: string): unknown {
  const dataType = whichStringType(data);
  switch (dataType) {
    case 'null':
      return null;
    case 'boolean':
      return data === 'true' ? true : false;
    case 'object':
      return {};
    case 'array':
      return [];
    case 'string':
      return data.replace(/"/g, '');
    default:
      return Number(data);
  }
}

function extractKeyValueFromLine(line: string): [string, string] {

  const [key, value] = line.split('=');
  return [key.trim(), prepareValue(value)];
}

type stringOrNumber = string | number;
export function extractKeys(keys: string): stringOrNumber[] {
  let path: stringOrNumber[] = [];
  let regex = /\["(.*?)"\]|\[(\d+)\]|\.(\w+)/g;
  let matches = keys.matchAll(regex);

  for (let match of matches) {
    let key: stringOrNumber = match[1] || match[2] || match[3];
    if (match[2]) key = Number(key); // convert to number if it's a digit
    path.push(key);
  }

  return path;
}

export function assignValue(data: object | unknown[], path: stringOrNumber[], value: string): void {
  let current: any = data;

  for (let i = 0; i < path.length; i++) {
    let key = path[i];

    if (i === path.length - 1) {
      // Estamos en el último elemento de la ruta, asignar el valor
      switch (whichStringType(value)) {
        case 'null':
          current[key] = null;
          break;
        case 'boolean':
          current[key] = value === 'true';
          break;
        case 'object':
          current[key] = {};
          break;
        case 'array':
          current[key] = [];
          break;
        case 'string':
          current[key] = value.slice(1, -1); // Eliminar las comillas
          break;
        case 'number':
          current[key] = Number(value);
          break;
      }
    } else {
      // No estamos en el último elemento de la ruta, crear un nuevo objeto o array si es necesario
      if (current[key] === undefined) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
      current = current[key];
    }
  }
}


export function ungronRaw(stdin: string): string {
  const lines = stdin.split('\n');
  const firstLine = lines.shift() as string;
  const [key, value] = extractKeyValueFromLine(firstLine);

  if (key !== 'json') {
    throw new Error('invalid gron');
  }
  let data = returnValue(value);
  if (typeof data !== 'object' || data === null) {
    return JSON.stringify(data);
  }

  for (const line of lines) {
    const _line = line.trim();
    if (!_line) {
      continue;
    }
    const [keys, value] = extractKeyValueFromLine(_line);
    const path = extractKeys(keys);
    assignValue(data, path, value);

  }
  return JSON.stringify(data, null, 2);

}

export async function ungron(): Promise<void> {
  const stdin = await readStdin();
  const json = ungronRaw(stdin);
  console.log(json);
}


async function readStdin(): Promise<string> {
  const decoder = new TextDecoder();
  let text = ''
  for await (const chunk of Deno.stdin.readable) {
    text += decoder.decode(chunk);
  }
  return text;
}