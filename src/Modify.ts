import {Get} from './Get'
import {Set} from './Set'
import { DeepPartial } from './DeepPartial';

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
  _actual: (a: A, params: Params, f: (b: B) => B) => A
  compose: ModifyCompose<A, B, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
}

export namespace Modify {
  export const create = <A, B, Params extends {}>(modify: (a: A, p: Params, f: (b: B) => B) => A) => {
    const clone: any = function(a: A, p: any, f: any) {
      if (arguments.length == 2) {
        return clone(a, undefined, p)
      }
      return modify(a, p, f)
    }

    clone.type = "modify"
    clone._actual = clone
    clone.compose = <C, BCParams>(other: Modify<B, C, BCParams> | Set<B, C, BCParams>) => {
      switch(other.type) {
        case "modify":
          return create<A, C, Params & BCParams>((a, p, f) => clone._actual(a, p, (b: B) => other._actual(b, p, f)))
        case "set":
          return Set.create<A, C, Params & BCParams>((a, p, c) => clone._actual(a, p, (b: B) => other._actual(b, p, c)))
      }
    }

    clone.merge =  (a: A, params: Params, someB: Partial<B>): A =>
      clone._actual(a, params, (b: B) => ({ ...b as any, ...someB as any }))
  
    clone.deepMerge = (a: A, someB: DeepPartial<B>, params: Params): A =>
      clone._actual(a, params, (b: B) => DeepPartial.merge(b, someB))

    return clone as Modify<A, B, Params>
  }

  export const fromGetSet = <A, B, Params extends {}>(get: Get<A, B, Params>, set: Set<A, B, Params>): Modify<A, B, Params> =>
    create((a, p, f) => set._actual(a, p, f(get._actual(a, p))))

  export const fromMaybeGetSet = <A, B, Params extends {}>(get: Get<A, B | null, Params>, set: Set<A, B, Params>): Modify<A, B, Params> =>
    create((a, p, f) => {
      const b = get._actual(a, p)
      return b === null ? a : set._actual(a, p, f(b))
    })
}