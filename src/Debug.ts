import { Extension } from "./Extension";

export function Debug() {
  return Debug.create()
}

export namespace Debug {

  const wrap = (level: DebugLevel, name: string, f: Function) => (...args: any[]) => {
    let indent = ""
    for (let i = 0; i < level.level; i++) {
      indent += ">> "
    }
    console.log(indent + `Calling ${name} with arguments:`, ...args)
    level.level++
    const result = f(...args)
    level.level--
    console.log(indent + "Result:", result)
    console.log()
    return result
  }

  interface DebugLevel {
    level: number
  }

  export const create = (): Extension => {
    const level: DebugLevel = { level: 0 }
    return Extension.create(optic => {
      switch (optic.type) {
        case "get":
        case "set":
        case "modify":
          optic._underlying = wrap(level, optic.type, optic._underlying)
          break;
      }
    })
  }
}