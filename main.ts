

type Gron = Generator<string, void, unknown>;



export async function gron(path: string): Promise<Gron> {
  const json = await getJson(path);
  return gronRaw(json);
}


export function gronRaw(json: string): Gron {
  const data = JSON.parse(json);
  return gronUnknown(data);
}




function getJson(path: string): Promise<string> {
  try {
    const url = new URL(path);
    return fetch(url).then((res) => res.text());
  } catch (error) {
    return Deno.readTextFile(path);
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
    yield* gronUnknown(data[key], `${path}.${key}`);
  }
}

function* gronArray(data: unknown[], path: string): Gron {
  yield `${path} = [];`;
  for (const key in data) {
    yield* gronUnknown(data[key], `${path}[${key}]`);
  }


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