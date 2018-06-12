import { Get, GetSignature } from './Get'
import { Set } from './Set'
import { Modify, Merge, DeepMerge } from './Modify'
import { Composable } from './Transformer'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { MaybeSelectorPropOverloads, Prop } from './Prop'
import { IndexBy } from './IndexBy'
import { Choose } from './Choose';
import { Extension } from './Extension';

export interface MaybeSelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
}

export type MaybeSelector<A, B, Params extends {} = {}> = {
  type: "maybeSelector"
  extend: (ext: Extension) => MaybeSelector<A, B, Params>

  get: Get<A, B | null, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: MaybeSelectorCompose<A, B, Params>
  prop: MaybeSelectorPropOverloads<A, B, Params>
  indexBy: IndexBy<A, B, Params>
  choose: <C extends B>(pred: (b: B) => b is C) => MaybeSelector<A, C, Params>
  merge: Merge<A, B, Params>
  deepMerge: DeepMerge<A, B, Params>
  withDefault: (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)) => Selector<A, B, Params>
  withDefaultValue: (ifNull: B) => Selector<A, B, Params>
}

export namespace MaybeSelector {
  export const fromGetSet = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B | null, set: (a: A, p: Params, b: B) => A) =>
    create(Get.create(get), Set.create(set))

  export const create = <A, B, Params extends {} = {}>(get: Get<A, B | null, Params>, set: Set<A, B, Params>, ext: Extension = Extension.none): MaybeSelector<A, B, Params> => {
    get = get.extend(ext)
    set = set.extend(ext)

    const modify = Modify.fromMaybeGetSet(get, set).extend(ext)

    const extend = (newExtension: Extension) => 
      create(get, set, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.composeMaybe(get, other).extend(ext)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), modify.compose(other.set), ext)
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), modify.compose(other.set), ext)
        case "maybeConverter":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), set.compose(other.reverseGet), ext)
        case "converter":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), set.compose(other.reverseGet), ext)
      }
    }
    
    const prop = Prop.implementation(compose)
    const indexBy = IndexBy.implementation(compose)
    const choose = Choose.implementation(compose)
    const merge = modify.merge
    const deepMerge = modify.deepMerge

    const withDefault = (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)): Selector<A, B, Params> => {
      const ifNullGet = Get.create<A, B, Params>(ifNull, ext)
      return Selector.create<A, B, Params>(Get.create((a, p) => {
        const b = get._underlying(a, p)
        return b === null || b === undefined ? ifNullGet._underlying(a, p): b
      }, ext), set, ext)
    }

    const withDefaultValue = (ifNull: B): Selector<A, B, Params> =>
      withDefault(Get.create<A, B, Params>(_ => ifNull, ext))

    const maybeSelector: MaybeSelector<A, B, Params> = {
      type: "maybeSelector",
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
      withDefault,
      withDefaultValue
    }

    ext.apply(maybeSelector)

    return maybeSelector
  }
}
