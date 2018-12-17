import { Get, GetSignature } from './Get'
import { Set } from './Set'
import { MaybeGet } from './MaybeGet'
import { Modify, Merge, DeepMerge } from './Modify'
import { Composable } from './Composable'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { MaybeSelectorPropOverloads, Prop } from './Prop'
import { IndexBy, IndexByMaybe } from './IndexBy'
import { Choose, ChooseOverloads } from './Choose';
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { Subtract, Property } from './util';
import { IfDefinedOverloads, IfDefined } from './IfDefined';
import { Structure, Dimensionality } from './Discriminants';

export interface MaybeSelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeGet<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
}

export interface MaybeSelector<A, B, Params extends {} = {}> {
  _structure: Structure.Select
  _dimensionality: Dimensionality.Maybe
  type: "maybeSelector"
  extend: (ext: Extension) => MaybeSelector<A, B, Params>

  get: MaybeGet<A, B, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: MaybeSelectorCompose<A, B, Params>
  prop: MaybeSelectorPropOverloads<A, B, Params>
  indexBy: IndexByMaybe<A, B, Params>
  choose: ChooseOverloads<Dimensionality.Maybe, Structure.Select, A, B, Params>
  ifDefined: IfDefinedOverloads<Dimensionality.Maybe, Structure.Select, A, B, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
  mapParams: <P2 extends {}>(map: (p2: P2) => Params) => MaybeSelector<A, B, P2>
  addParam: <P extends string, V = string>(p: P) => MaybeSelector<A, B, Params & Property<P, V>>
  withParams: <P2 extends Partial<Params>>(params: P2) => MaybeSelector<A, B, Subtract<Params, P2>>
  withDefault: (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)) => Selector<A, B, Params>
  withDefaultValue: (ifNull: B) => Selector<A, B, Params>
  memoize: () => MaybeSelector<A, B, Params>
  debug: () => MaybeSelector<A, B, Params>
}

export namespace MaybeSelector {
  export const fromGetSet = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B | null | undefined, set: (a: A, p: Params, b: B) => A) =>
    create(MaybeGet.create(convertUndefinedToNull(get)), Set.create(set))

  const convertUndefinedToNull = <A, B, Params>(get: (a: A, p: Params) =>  B | null | undefined) =>
    (a: A, p: Params): B | null => {
      const result = get(a, p)
      return result === undefined ? null : result
    }

  export const create = <A, B, Params extends {} = {}>(get: MaybeGet<A, B, Params>, set: Set<A, B, Params>, ext: Extension = Extension.none): MaybeSelector<A, B, Params> => {
    get = get.extend(ext)
    set = set.extend(ext)

    const modify = Modify.fromMaybeGetSet(get, set).extend(ext)

    const extend = (newExtension: Extension) => 
      create(get, set, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      if (Composable.is(Dimensionality.Single, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Single, Structure.Select, other)) {
        return MaybeSelector.create(get.compose(other), modify.compose(other.set), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Select, other)) {
        return MaybeSelector.create(get.compose(other), modify.compose(other.set), ext)
      } else if (Composable.is(Dimensionality.Single, Structure.Convert, other)) {
        return MaybeSelector.create(get.compose(other), set.compose(other.reverseGet), ext)
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

    const withDefault = (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)): Selector<A, B, Params> =>
      Selector.create<A, B, Params>(get.withDefault(ifNull), set, ext)

    const withDefaultValue = (ifNull: B): Selector<A, B, Params> =>
      withDefault(Get.create<A, B, Params>(_ => ifNull, ext))

    const maybeSelector: MaybeSelector<A, B, Params> = {
      _structure: Structure.Select,
      _dimensionality: Dimensionality.Maybe,
      type: "maybeSelector",
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
      addParam: () => maybeSelector as any,
      withParams,
      withDefault,
      withDefaultValue,
      memoize: () => extend(Memoize()),
      debug: () => extend(Debug())
    }

    ext.apply(maybeSelector)

    return maybeSelector
  }
}
