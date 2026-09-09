// src/__mocks__/sqlite-wasm.js
export default async function sqlite3InitModule() {
  return {
    oo1: {
      OpfsDb: class {
        constructor(filename) {
          this.filename = filename;
        }
        exec(sql) {
          return [];
        }
        prepare(sql) {
          return {
            bind: (params) => ({
              step: () => false,
              get: () => ({})
            })
          };
        }
      }
    }
  };
}