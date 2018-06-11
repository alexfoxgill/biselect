import {Get} from './Get'
import {Set} from './Set'
import { DeepPartial } from './DeepPartial';
import { Extension } from './Extension';

export type ModifySignature<A, B, Params extends {}> =
  {} extends Params
    ? (a: A, f: (b: B) => B) => A
    : (a: A, p: Params, f: (b: B) => B) => A

export interface ModifyCompose<A, B, Params> {
  <C, BCParams>(other: Modify<B, C, BCParams>): Modify<A, C, Params & BCParams>
  <C, BCParams>(other: Set<B, C, BCParams>): Set<A, C, Params & BCParams>
}

export type Merge<A, B, Params extends {}> =
  B extends object
  ? {} extends Params
    ? (a: A, someB: Partial<B>) => A
    : (a: A, params: Params, someB: Partial<B>) => A
  : never

export type DeepMerge<A, B, Params extends {}> =
  B extends object
  ? {} extends Params
    ? (a: A, b: DeepPartial<B>) => A
    : (a: A, params: Params, b: DeepPartial<B>) => A
  : never

export type Modify<A, B, Params extends {}> = ModifySignature<A, B, Params> & {
  type: "modify"
  _underlying: (a: A, params: Params, f: (b: B) => B) => A
  extend: (ext: Extension) => Modify<A, B, Params>

  compose: ModifyCompose<A, B, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
}

export namespace Modify {
  const normaliseArgs = <A, P, F>(modify: (a: A, p: P, f: F) => A) =>
    function(a: A, p: P, f: F) {
      return arguments.length === 2
        ? modify(a, undefined as any, p as any)
        : modify(a, p, f)
    }

  export const create = <A, B, Params extends {}>(modify: (a: A, p: Params, f: (b: B) => B) => A, ext: Extension = Extension.none) => {
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

    clone.merge = normaliseArgs((a: A, params: Params, someB: Partial<B>): A =>
      clone(a, params, (b: B) => ({ ...b as any, ...someB as any })))
  
    clone.deepMerge = normaliseArgs((a: A, params: Params, someB: DeepPartial<B>): A =>
      clone(a, params, (b: B) => DeepPartial.merge(b, someB)))

    ext.extend(clone)

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