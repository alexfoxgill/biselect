import { Get } from './Get'
import { Extension } from './Extension';

export type SetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A, b: B) => A
  : (a: A, p: Params, b: B) => A

export type Set<A, B, Params extends {}> = SetSignature<A, B, Params> & {
  type: "set"
  _underlying: (a: A, params: Params, b: B) => A
  extend: (ext: Extension) => Set<A, B, Params>

  compose: <C, BCParams>(get: Get<C, B, BCParams>) => Set<A, C, Params & BCParams>
}

export namespace Set {

  const normaliseArgs = <A, P, B>(set: (a: A, p: P, b: B) => A) =>
    function(a: A, p: P, b: B) {
      return arguments.length === 2
        ? set(a, undefined as any, p as any)
        : set(a, p, b)
    }

  export const create = <A, B, Params extends {}>(set: (a: A, p: Params, b: B) => A, ext: Extension = Extension.none): Set<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "set"
    clone._underlying = normaliseArgs(set)

    clone.extend = (newExtension: Extension) => 
      create(set, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams>(get: Get<C, B, BCParams>) =>
      create<A, C, Params & BCParams>((a, p, c) => clone._underlying(a, p, get._underlying(c, p)), ext)

    ext.apply(clone)

    return clone as Set<A, B, Params>
  }
}
