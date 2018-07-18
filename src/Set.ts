import { Get } from './Get'
import { Extension } from './Extension';
import { Debug } from './Debug';
import * as DeepEqual from 'fast-deep-equal'
import { Subtract, combine } from './util';
import { Update } from './Update';

export type SetSignature<A, B, Params extends {}> =
  ((b: B) => Update<A, Params>)
  &
  ({} extends Params
    ? (a: A, b: B) => A
    : (a: A, p: Params, b: B) => A)

export type Set<A, B, Params extends {}> = SetSignature<A, B, Params> & {
  type: "set"
  _underlying: (a: A, params: Params, b: B) => A
  extend: (ext: Extension) => Set<A, B, Params>

  compose: <C, BCParams>(get: Get<C, B, BCParams>) => Set<A, C, Params & BCParams>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => Set<A, B, P2>
  withParams: <P2 extends Partial<Params>>(params: P2) => Set<A, B, Subtract<Params, P2>>
  debug: () => Set<A, B, Params>
}

export namespace Set {

  const normaliseArgs = <A, P, B>(set: (a: A, p: P, b: B) => A) =>
    function(a: A, p: P, b: B) {
      switch (arguments.length) {
        case 1: {
          const b = a as any as B
          return Update.create<A, P>((aa, pp) => set(aa, pp, b))
        }
        case 2: return set(a, undefined as any, p as any)
        default: return set(a, p, b)
      }
    }

  export const create = <A, B, Params extends {} = {}>(set: (a: A, p: Params, b: B) => A, ext: Extension = Extension.none): Set<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "set"
    clone._equality = DeepEqual
    clone._underlying = normaliseArgs((a: A, p: Params, b: B) => {
      const result = set(a, p, b)
      // if the update had no effect, don't change the object reference
      return clone._equality(a, result) ? a : result
    })

    clone.extend = (newExtension: Extension) => 
      create(set, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams>(get: Get<C, B, BCParams>) =>
      create<A, C, Params & BCParams>((a, p, c) => clone._underlying(a, p, get._underlying(c, p)), ext)

    clone.mapParams = <P2>(map: (p2: P2) => Params) =>
      create<A, B, P2>((a, p, b) => clone(a, map(p), b))

    clone.withParams = <P2 extends Partial<Params>>(params: P2): Set<A, B, Subtract<Params, P2>> =>
      create<A, B, Subtract<Params, P2>>((a, p, b) => clone(a, combine(p, params), b))

    clone.debug = () => clone.extend(Debug())

    ext.apply(clone)

    return clone as Set<A, B, Params>
  }
}
