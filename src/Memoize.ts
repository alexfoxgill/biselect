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
      if (a === memA && shallowEqual(p, memP) && memB !== undefined) {
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

    
  // https://stackoverflow.com/a/37636728/1860652
  const hasOwnProperty = Object.prototype.hasOwnProperty
  const is = (x: any, y: any) => x === y ? x !== 0 || 1 / x === 1 / y : x !== x && y !== y
  function shallowEqual(objA: any, objB: any) {
      if (is(objA, objB)) {
          return true
      }
  
      if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
          return false
      }
  
      let keysA = Object.keys(objA);
      let keysB = Object.keys(objB);
  
      if (keysA.length !== keysB.length) {
          return false
      }
  
      for (let i = 0; i < keysA.length; i++) {
          if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
              return false
          }
      }
  
      return true
  }
}