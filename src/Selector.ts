import { Get } from './Get'
import { Set } from './Set'
import { Modify, DeepMerge, Merge } from './Modify'
import { MaybeSelector } from './MaybeSelector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { Composable } from './Transformer'
import { SelectorPropOverloads, Prop } from './Prop'
import { IndexBy } from './IndexBy';
import { Choose } from './Choose';
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';

export interface SelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Selector<A, C, Params & BCParams>
}

export interface Selector<A, B, Params extends {} = {}> {
  type: "selector"
  extend: (ext: Extension) => Selector<A, B, Params>
  get: Get<A, B, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: SelectorCompose<A, B, Params>
  prop: SelectorPropOverloads<A, B, Params>
  indexBy: IndexBy<A, B, Params>
  choose: <C extends B>(pred: (b: B) => b is C) => MaybeSelector<A, C, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
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
      switch (other.type) {
        case "get":
          return get.compose(other)
        case "maybeSelector":
          return MaybeSelector.create(get.compose(other.get), modify.compose(other.set), ext)
        case "selector":
          return Selector.create(get.compose(other), modify.compose(other.set), ext)
        case "maybeConverter":
          return MaybeSelector.create(get.compose(other.get), set.compose(other.reverseGet), ext)
        case "converter":
          return Selector.create(get.compose(other.get), set.compose(other.reverseGet), ext)
      }
    }

    const prop = Prop.implementation(compose)
    const indexBy = IndexBy.implementation(compose)
    const choose = Choose.implementation(compose)
    const merge = modify.merge
    const deepMerge = modify.deepMerge

    const selector: Selector<A, B, Params> = {
      type: "selector",
      extend,
      get,
      set,
      modify,
      compose,
      prop,
      indexBy,
      choose,
      merge,
      deepMerge,
      memoize: () => extend(Memoize()),
      debug: () => extend(Debug())
    }

    ext.apply(selector)

    return selector
  }
}

