import {Get} from './Get'
import {Set} from './Set'
import { DeepPartial } from './DeepPartial';
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Update } from './Update'


export interface NoParamsModify<A, B> {
  (f: (b: B) => B): Update<A>
  (a: A, f: (b: B) => B): A
}

export interface ParamsModify<A, B, Params> {
  (f: (b: B, params: Params) => B): Update<A, Params>
  (a: A, p: Params, f: (b: B) => B): A
}

export type ModifySignature<A, B, Params extends {}> =
  {} extends Params
    ? NoParamsModify<A, B>
    : ParamsModify<A, B, Params>

export interface ModifyCompose<A, B, Params> {
  <C, BCParams>(other: Modify<B, C, BCParams>): Modify<A, C, Params & BCParams>
  <C, BCParams>(other: Set<B, C, BCParams>): Set<A, C, Params & BCParams>
}

export type IfObject<A, B> = A extends object ? B : never

export type Merge<A, B, Params extends {}> = IfObject<B,
    ((b: Partial<B>) => Update<A, Params>)
    &
    ({} extends Params
      ? (a: A, someB: Partial<B>) => A
      : (a: A, params: Params, someB: Partial<B>) => A)
  >

export type DeepMerge<A, B, Params extends {}> = IfObject<B,
    ((b: DeepPartial<B>) => Update<A, Params>)
    &
    ({} extends Params
      ? (a: A, b: DeepPartial<B>) => A
      : (a: A, params: Params, b: DeepPartial<B>) => A)
  >

export type Modify<A, B, Params extends {} = {}> = ModifySignature<A, B, Params> & {
  type: "modify"
  _underlying: (a: A, params: Params, f: (b: B) => B) => A
  extend: (ext: Extension) => Modify<A, B, Params>

  compose: ModifyCompose<A, B, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => Modify<A, B, P2>
  memoize: () => Modify<A, B, Params>
  debug: () => Modify<A, B, Params>
}

export namespace Modify {
  const normaliseArgs = <A, P, B>(modify: (a: A, p: P, f: (b: B) => B) => A) =>
    function (a: A, p: P, f: (b: B) => B) {
      switch (arguments.length) {
        case 1:
          const update: (b: B, p: P) => B = a as any
          return Update.create<A, P>((a, p) => modify(a, p, b => update(b, p)))
        case 2: return modify(a, undefined as any, p as any)
        default: return modify(a, p, f)
      }
    }

  export const create = <A, B, Params extends {} = {}>(modify: (a: A, p: Params, f: (b: B) => B) => A, ext: Extension = Extension.none) => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "modify"
    clone._underlying = normaliseArgs(modify)

    clone.compose = <C, BCParams>(other: Modify<B, C, BCParams> | Set<B, C, BCParams>) => {
      switch(other.type) {
        case "modify":
          return create<A, C, Params & BCParams>((a, p, f) => clone._underlying(a, p, (b: B) => other._underlying(b, p, f)))
        case "set":
          return Set.create<A, C, Params & BCParams>((a, p, c) => clone._underlying(a, p, (b: B) => other._underlying(b, p, c)))
      }
    }

    clone.extend = (newExtension: Extension) => 
      create(modify, Extension.combine(ext, newExtension))

    clone.merge = function(a: A, p: Params, someB: Partial<B>) {
      switch (arguments.length) {
        case 1: {
          const someB = a as any as Partial<B>
          return Update.create<A, Params>((a, p) => clone(a, p, (b: B) => ({ ...b as any, ...someB as any })))
        }
        case 2: {
          const someB = p as any as Partial<B>
          return clone(a, (b: B) => ({ ...b as any, ...someB as any }))
        }
        default:
          return clone(a, p, (b: B) => ({ ...b as any, ...someB as any }))
      }
    }
  
    clone.deepMerge = function (a: A, p: Params, someB: DeepPartial<B>) {
      switch (arguments.length) {
        case 1: {
          const someB = a as any as DeepPartial<B>
          return Update.create<A, Params>((a, p) => clone(a, p, (b: B) => DeepPartial.merge(b, someB)))
        }
        case 2: {
          const someB = p as any as DeepPartial<B>
          return clone(a, p, (b: B) => DeepPartial.merge(b, someB))
        }
        default:
          return clone(a, p, (b: B) => DeepPartial.merge(b, someB))
      }
    }

    clone.mapParams = <P2>(map: (p2: P2) => Params) =>
      create<A, B, P2>((a, p, f) => clone(a, map(p), f), ext)

    clone.memoize = () => clone.extend(Memoize())
    clone.debug = () => clone.extend(Debug())

    ext.apply(clone)

    return clone as Modify<A, B, Params>
  }

  export const fromGetSet = <A, B, Params extends {}>(get: Get<A, B, Params>, set: Set<A, B, Params>): Modify<A, B, Params> =>
    create((a, p, f) => set._underlying(a, p, f(get._underlying(a, p))))

  export const fromMaybeGetSet = <A, B, Params extends {}>(get: Get<A, B | null, Params>, set: Set<A, B, Params>): Modify<A, B, Params> =>
    create((a, p, f) => {
      const b = get._underlying(a, p)
      return b === null || b === undefined ? a : set._underlying(a, p, f(b))
    })
}