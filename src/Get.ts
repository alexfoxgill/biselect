import { Composable } from './Transformer'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { GetPropOverloads, Prop } from './Prop'
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Subtract, combine } from './util';
import { Choose } from './Choose'

export type GetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A) => B
  : (a: A, params: Params) => B

export interface GetCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Get<A, C, Params & BCParams>
}

export interface GetCombine<A, B, Params> {
  <C, ACParams>(other: Get<A, C, ACParams>): Get<A, [B, C], Params & ACParams>
  <C, ACParams, D, ADParams>(ac: Get<A, C, ACParams>, ad: Get<A, D, ADParams>): Get<A, [B, C, D], Params & ACParams & ADParams>
  <C, ACParams, D, ADParams, E, AEParams>(ac: Get<A, C, ACParams>, ad: Get<A, D, ADParams>, ae: Get<A, E, AEParams>): Get<A, [B, C, D, E], Params & ACParams & ADParams & AEParams>
}

export type Get<A, B, Params extends {} = {}> = GetSignature<A, B, Params> & {
  type: "get"
  _underlying: (a: A, params: Params) => B
  extend: (ext: Extension) => Get<A, B, Params>

  compose: GetCompose<A, B, Params>
  map: <C>(f: (b: B, p: Params) => C) => Get<A, C, Params>
  choose: <C extends B>(pred: (b: B) => b is C) => Get<A, C | null, Params> 
  combine: GetCombine<A, B, Params>
  prop: GetPropOverloads<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => Get<A, B, P2>
  withParams: <P2 extends Partial<Params>>(params: P2) => Get<A, B, Subtract<Params, P2>>
  memoize: () => Get<A, B, Params>
  debug: () => Get<A, B, Params>
}

export namespace Get {
  export const create = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B, ext: Extension = Extension.none): Get<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "get"
    clone._underlying = (a: A, p: Params) => get(a, p)
    
    clone.extend = (newExtension: Extension) => 
      create(get, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams extends {}>(other: Composable<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.create<A, C, Params & BCParams>((a, p) => other._underlying(clone(a, p), p), ext)
        case "maybeSelector":
        case "selector":
        case "maybeConverter":
        case "converter":
          return clone.compose(other.get)
      }
    }

    clone.map = <C>(f: (b: B, p: Params) => C): Get<A, C, Params> =>
      Get.create((a, p) => f(clone(a, p), p), ext)

    clone.choose = Choose.implementation(clone.compose)

    clone.combine = (...others: Get<A, any, any>[]) =>
      Get.create((a: A, p) => [clone(a, p), ...others.map(x => x._underlying(a, p))], ext)

    clone.prop = Prop.implementation(clone.compose)

    clone.mapParams = <P2>(map: (p2: P2) => Params) =>
      create<A, B, P2>((a, p) => clone(a, map(p)), ext)

    clone.withParams = <P2 extends Partial<Params>>(params: P2): Get<A, B, Subtract<Params, P2>> =>
      create<A, B, Subtract<Params, P2>>((a, p) => clone(a, combine(p, params)))

    clone.memoize = () => clone.extend(Memoize())
    clone.debug = () => clone.extend(Debug())

    ext.apply(clone)

    return clone as Get<A, B, Params>
  }

  export const composeMaybe = <A, B, C, ABParams, BCParams>(ab: Get<A, B | null, ABParams>, bc: Get<B, C, BCParams>): Get<A, C | null, ABParams & BCParams> =>
    Get.create<A, C | null, ABParams & BCParams>((a, p) => {
      const b = ab._underlying(a, p)
      return b === null || b === undefined ? null : bc._underlying(b, p)
    })
}