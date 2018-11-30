import { Composable } from './Transformer'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { GetPropOverloads, Prop } from './Prop'
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Subtract, combine, Property } from './util';
import { Choose, MaybeGetChooseOverloads } from './Choose'
import { Get } from './Get'
import { MaybeGetIfDefinedOverloads, IfDefined } from './IfDefined';

export type MaybeGetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A) => B | null
  : (a: A, params: Params) => B | null

export interface MaybeGetCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeGet<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
}

export interface MaybeGetCombine<A, B, Params> {
  <C, ACParams>(other: MaybeGet<A, C, ACParams>): MaybeGet<A, [B, C], Params & ACParams>
  <C, ACParams, D, ADParams>(ac: MaybeGet<A, C, ACParams>, ad: MaybeGet<A, D, ADParams>): MaybeGet<A, [B, C, D], Params & ACParams & ADParams>
  <C, ACParams, D, ADParams, E, AEParams>(ac: MaybeGet<A, C, ACParams>, ad: MaybeGet<A, D, ADParams>, ae: MaybeGet<A, E, AEParams>): MaybeGet<A, [B, C, D, E], Params & ACParams & ADParams & AEParams>
}

export type MaybeGet<A, B, Params extends {} = {}> = MaybeGetSignature<A, B, Params> & {
  type: "maybeGet"
  _underlying: (a: A, params: Params) => B | null
  extend: (ext: Extension) => MaybeGet<A, B, Params>

  compose: MaybeGetCompose<A, B, Params>
  map: <C>(f: (b: B, p: Params) => C) => MaybeGet<A, C, Params>
  choose: MaybeGetChooseOverloads<A, B, Params>
  ifDefined: MaybeGetIfDefinedOverloads<A, B, Params>
  combine: MaybeGetCombine<A, B, Params>
  prop: GetPropOverloads<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => MaybeGet<A, B, P2>
  addParam: <P extends string, V = string>(p: P) => MaybeGet<A, B, Params & Property<P, V>>
  withParams: <P2 extends Partial<Params>>(params: P2) => MaybeGet<A, B, Subtract<Params, P2>>
  memoize: () => MaybeGet<A, B, Params>
  debug: () => MaybeGet<A, B, Params>
}

export namespace MaybeGet {
  export const create = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B | null, ext: Extension = Extension.none): MaybeGet<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "maybeGet"
    clone._underlying = (a: A, p: Params) => get(a, p)
    
    clone.extend = (newExtension: Extension) => 
      create(get, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams extends {}>(other: Composable<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
        case "maybeGet":
          return MaybeGet.create<A, C, Params & BCParams>((a, p) => { 
            const result = clone(a, p)
            return result !== null ? other._underlying(result, p) : null
          }, ext)
        case "maybeSelector":
        case "selector":
        case "maybeConverter":
        case "converter":
          return clone.compose(other.get)
      }
    }

    clone.map = <C>(f: (b: B, p: Params) => C): MaybeGet<A, C, Params> =>
      clone.compose(Get.create(f))

    clone.choose = Choose.implementation(clone.compose)
    clone.ifDefined = IfDefined.implementation(clone.compose)

    clone.combine = (...others: MaybeGet<A, any, any>[]) =>
      create((a: A, p) => [clone(a, p), ...others.map(x => x._underlying(a, p))], ext)

    clone.prop = Prop.implementation(clone.compose)

    clone.mapParams = <P2>(map: (p2: P2) => Params) =>
      create<A, B, P2>((a, p) => clone(a, map(p)), ext)

    clone.addParam = () => clone

    clone.withParams = <P2 extends Partial<Params>>(params: P2): MaybeGet<A, B, Subtract<Params, P2>> =>
      create<A, B, Subtract<Params, P2>>((a, p) => clone(a, combine(p, params)))

    clone.memoize = () => clone.extend(Memoize())
    clone.debug = () => clone.extend(Debug())

    ext.apply(clone)

    return clone as MaybeGet<A, B, Params>
  }
}