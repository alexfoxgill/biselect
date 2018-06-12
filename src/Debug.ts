import { Extension } from "./Extension";

export function Debug() {
  return Debug.create()
}

export namespace Debug {

  const wrap = (name: string, f: Function) => (...args: any[]) => {
    console.group()
    console.log(`Calling ${name} with arguments:`, ...args)
    const result = f(...args)
    console.log("Result:", result)
    console.groupEnd()
    return result
  }

  export const create = (): Extension => {
    return Extension.create(optic => {
      switch (optic.type) {
        case "get":
        case "set":
        case "modify":
          optic._underlying = wrap(optic.type, optic._underlying)
          break;
      }
    })
  }
}