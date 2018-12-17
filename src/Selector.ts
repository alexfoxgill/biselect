import { Get } from './Get'
import { Set } from './Set'
import { Modify, DeepMerge, Merge } from './Modify'
import { MaybeSelector } from './MaybeSelector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { Composable } from './Composable'
import { SelectorPropOverloads, Prop } from './Prop'
import { IndexBy } from './IndexBy';
import { Choose, ChooseOverloads } from './Choose';
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Subtract, Property } from './util'
import { MaybeGet } from './MaybeGet';
import { IfDefinedOverloads, IfDefined } from './IfDefined';
import { Dimensionality, Structure } from './Discriminants';

export interface SelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeGet<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Selector<A, C, Params & BCParams>
}

export interface Selector<A, B, Params extends {} = {}> {
  _structure: Structure.Select
  _dimensionality: Dimensionality.Single
  type: "selector"
  extend: (ext: Extension) => Selector<A, B, Params>
  get: Get<A, B, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: SelectorCompose<A, B, Params>
  prop: SelectorPropOverloads<A, B, Params>
  indexBy: IndexBy<A, B, Params>
  choose: ChooseOverloads<Dimensionality.Single, Structure.Select, A, B, Params>
  ifDefined: IfDefinedOverloads<Dimensionality.Single, Structure.Select, A, B, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => Selector<A, B, P2>
  addParam: <P extends string, V = string>(p: P) => Selector<A, B, Params & Property<P, V>>
  withParams: <P2 extends Partial<Params>>(params: P2) => Selector<A, B, Subtract<Params, P2>>
  memoize: () => Selector<A, B, Params>
  debug: () => Selector<A, B, Params>
}

export namespace Selector {
  export const fromGetSet = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B, set: (a: A, p: Params, b: B) => A) =>
    create(Get.create(get), Set.create(set))

  export const create = <A, B, Params extends {} = {}>(get: Get<A, B, Params>, set: Set<A, B, Params>, ext: Extension = Extension.none): Selector<A, B, Params> => {
    get = get.extend(ext)
    set = set.extend(ext)
    
    const modify = Modify.fromGetSet(get, set).extend(ext)
    
    const extend = (newExtension: Extension) => 
      create(get, set, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      if (Composable.is(Dimensionality.Single, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Single, Structure.Select, other)) {
        return Selector.create(get.compose(other), modify.compose(other.set), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Select, other)) {
        return MaybeSelector.create(get.compose(other), modify.compose(other.set), ext)
      } else if (Composable.is(Dimensionality.Single, Structure.Convert, other)) {
        return Selector.create(get.compose(other), set.compose(other.reverseGet), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Convert, other)) {
        return MaybeSelector.create(get.compose(other), set.compose(other.reverseGet), ext)
      }
    }

    const prop = Prop.implementation(compose)
    const indexBy = IndexBy.implementation(compose)
    const choose = Choose.implementation(compose)
    const ifDefined = IfDefined.implementation(compose)
    const merge = modify.merge
    const deepMerge = modify.deepMerge
    const mapParams = <P2>(map: (p2: P2) => Params) => create(get.mapParams(map), set.mapParams(map), ext)
    const withParams = <P2 extends Partial<Params>>(params: P2) => create(get.withParams(params), set.withParams(params), ext)

    const selector: Selector<A, B, Params> = {
      _structure: Structure.Select,
      _dimensionality: Dimensionality.Single,
      type: "selector",
      extend,
      get,
      set,
      modify,
      compose,
      prop,
      indexBy,
      choose,
      ifDefined,
      merge,
      deepMerge,
      mapParams,
      addParam: () => selector as any,
      withParams,
      memoize: () => extend(Memoize()),
      debug: () => extend(Debug())
    }

    ext.apply(selector)

    return selector
  }
}

