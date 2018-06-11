import { Extension } from './Extension'

export function Memoize() {
  return Memoize.create()
}

export namespace Memoize {
  const memoizeGet = <A, B, Params>(get: (a: A, p: Params) => B) => {
    let memA: A | undefined = undefined
    let memP: Params | undefined = undefined
    let memB: B | undefined = undefined
    return (a: A, p: Params): B => {
      if (a === memA && p === memP && memB !== undefined) {
        return memB
      }

      memA = a
      memP = p
      memB = get(a, p)
      return memB!
    }
  }

  export const create = (): Extension =>
    Extension.create(optic => {
      if (optic.type === "get") {
        optic._underlying = memoizeGet(optic._underlying)
      }
    })
}