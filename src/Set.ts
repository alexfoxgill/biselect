import { Get } from './Get'

export type SetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A, b: B) => A
  : (a: A, p: Params, b: B) => A

export type Set<A, B, Params extends {}> = SetSignature<A, B, Params> & {
  type: "set"
  _actual: (a: A, params: Params, b: B) => A
  compose: <C, BCParams>(get: Get<C, B, BCParams>) => Set<A, C, Params & BCParams>
}

export namespace Set {
  export const create = <A, B, Params extends {}>(set: (a: A, p: Params, b: B) => A): Set<A, B, Params> => {
    const clone: any = function (a: A, p: any, b: any) {
      if (arguments.length == 2) {
        return clone(a, undefined, p)
      }
      return set(a, p, b)
    }
    clone.type = "set"
    clone._actual = clone

    clone.compose = <C, BCParams>(get: Get<C, B, BCParams>) =>
      create<A, C, Params & BCParams>((a, p, c) => clone._actual(a, p, get._actual(c, p)))

    return clone as Set<A, B, Params>
  }
}
