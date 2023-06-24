import { nodes, root, state } from "membrane";

async function api(method: string, path: string, query?: any, body?: any) {
  if (query) {
    Object.keys(query).forEach((key) => (query[key] === undefined ? delete query[key] : {}));
  }
  const querystr = query && Object.keys(query).length ? `?${new URLSearchParams(query)}` : "";

  //******************* TODO: use https ***************//
  const url = `http://api.membrane.io/${path}${querystr}`;

  const req = {
    method,
    body,
    headers: {
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "application/json",
    },
  };
  return await fetch(url, req);
}

export const Root = {
  status() {
    if (!state.token) {
      return `Not ready`;
    } else {
      return `Ready`;
    }
  },
  configure: async ({ args: { token } }) => {
    state.token = token;
  },
  programs: () => ({}),
  action: async ({ args: { gref } }) => {
    const res = await api("POST", "action", null, JSON.stringify({ gref }));
    return JSON.stringify(await res.json());
  },
  query: async ({ args: { ref, query } }) => {
    const res = await api("POST", "query", null, JSON.stringify({ gref: ref, query }));
    return JSON.stringify(await res.json());
  },
};

export const ProgramCollection = {
  one: async ({ args: { pid } }) => {
    const res = await api("GET", `ps?include_schemas=true&include_expressions=true`);
    const data = await res.json();
    // Find the program with the specified pid
    const program = data.programs.find((p: any) => p.pid === pid);

    // Check if the program is found
    if (program) {
      program.schema = JSON.stringify(program.schema);
      program.expressions = JSON.stringify(program.expressions);
    }
    return program;
  },
  page: async ({ args: { include_schemas, include_expressions } }) => {
    const res = await api("GET", `ps`, { include_schemas, include_expressions });
    const data = await res.json();
    return { items: data.programs, next: null };
  },
};

export const Program = {
  gref: ({ obj }) => {
    return root.programs.one({ pid: obj.pid });
  },
  schema: ({ obj }) => {
    return JSON.stringify(obj.schema);
  },
  kill: async ({ self }) => {
    const { pid } = self.$argsAt(root.programs.one);

    const res = await api("POST", "kill", null, JSON.stringify({ pid }));
    return await res.json();
  },
};
