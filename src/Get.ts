import { Composable } from './Composable'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { GetPropOverloads, Prop } from './Prop'
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Subtract, combine, Property } from './util';
import { Choose, GetChooseOverloads } from './Choose'
import { MaybeGet } from './MaybeGet';
import { GetIfDefinedOverloads, IfDefined } from './IfDefined';
import { Structure, Dimensionality } from './Discriminants';

export type GetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A) => B
  : (a: A, params: Params) => B

export interface GetCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeGet<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Get<A, C, Params & BCParams>
}

export interface GetCombine<A, B, Params> {
  <C, ACParams>(other: Get<A, C, ACParams>): Get<A, [B, C], Params & ACParams>
  <C, ACParams, D, ADParams>(ac: Get<A, C, ACParams>, ad: Get<A, D, ADParams>): Get<A, [B, C, D], Params & ACParams & ADParams>
  <C, ACParams, D, ADParams, E, AEParams>(ac: Get<A, C, ACParams>, ad: Get<A, D, ADParams>, ae: Get<A, E, AEParams>): Get<A, [B, C, D, E], Params & ACParams & ADParams & AEParams>
}

export type Get<A, B, Params extends {} = {}> = GetSignature<A, B, Params> & {
  _structure: Structure.Get
  _dimensionality: Dimensionality.Single
  type: "get"
  _underlying: (a: A, params: Params) => B
  extend: (ext: Extension) => Get<A, B, Params>

  compose: GetCompose<A, B, Params>
  map: <C>(f: (b: B, p: Params) => C) => Get<A, C, Params>
  choose: GetChooseOverloads<A, B, Params>
  ifDefined: GetIfDefinedOverloads<A, B, Params>
  combine: GetCombine<A, B, Params>
  prop: GetPropOverloads<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => Get<A, B, P2>
  addParam: <P extends string, V = string>(p: P) => Get<A, B, Params & Property<P, V>>
  withParams: <P2 extends Partial<Params>>(params: P2) => Get<A, B, Subtract<Params, P2>>
  memoize: () => Get<A, B, Params>
  debug: () => Get<A, B, Params>
}

export namespace Get {
  export const create = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B, ext: Extension = Extension.none): Get<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone._structure = Structure.Get
    clone._dimensionality = Dimensionality.Single
    clone.type = "get"
    clone._underlying = (a: A, p: Params) => get(a, p)
    
    clone.extend = (newExtension: Extension) => 
      create(get, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams extends {}>(other: Composable<B, C, BCParams>) => {
      if (Composable.is(Dimensionality.Single, Structure.Get, other)) {
        return Get.create<A, C, Params & BCParams>((a, p) => other._underlying(clone(a, p), p), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Get, other)) {
        return MaybeGet.create<A, C, Params & BCParams>((a, p) => other._underlying(clone(a, p), p), ext)
      } else if (Composable.is(Dimensionality.Single, Structure.Select, other)) {
        return clone.compose(other.get)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Select, other)) {
        return clone.compose(other.get)
      } else if (Composable.is(Dimensionality.Single, Structure.Convert, other)) {
        return clone.compose(other.get)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Convert, other)) {
        return clone.compose(other.get)
      }
    }

    clone.map = <C>(f: (b: B, p: Params) => C): Get<A, C, Params> =>
      Get.create((a, p) => f(clone(a, p), p), ext)

    clone.choose = Choose.implementation(clone.compose)
    clone.ifDefined = IfDefined.implementation(clone.compose)

    clone.combine = (...others: Get<A, any, any>[]) =>
      Get.create((a: A, p) => [clone(a, p), ...others.map(x => x._underlying(a, p))], ext)

    clone.prop = Prop.implementation(clone.compose)

    clone.mapParams = <P2>(map: (p2: P2) => Params) =>
      create<A, B, P2>((a, p) => clone(a, map(p)), ext)

    clone.addParam = () => clone

    clone.withParams = <P2 extends Partial<Params>>(params: P2): Get<A, B, Subtract<Params, P2>> =>
      create<A, B, Subtract<Params, P2>>((a, p) => clone(a, combine(p, params)))

    clone.memoize = () => clone.extend(Memoize())
    clone.debug = () => clone.extend(Debug())

    ext.apply(clone)

    return clone as Get<A, B, Params>
  }
}