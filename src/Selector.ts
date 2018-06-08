import { Get } from './Get'
import { Set } from './Set'
import { Modify } from './Modify'
import { MaybeSelector } from './MaybeSelector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { Optic } from './Optic'
import { CertainPropOverloads, Prop } from './Prop'
import { IndexBy } from './IndexBy';
import { Choose } from './Choose';

export interface SelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Selector<A, C, Params & BCParams>
}

export type Selector<A, B, Params extends {}> = {
  type: "selector"
  get: Get<A, B, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: SelectorCompose<A, B, Params>
  prop: CertainPropOverloads<A, B, Params>
  indexBy: IndexBy<A, B, Params>
  choose: <C extends B>(pred: (b: B) => b is C) => MaybeSelector<A, C, Params>
}

export namespace Selector {
  export const create = <A, B, Params extends {}>(get: Get<A, B, Params>, set: Set<A, B, Params>): Selector<A, B, Params> => {
    const modify = Modify.fromGetSet(get, set)

    const compose: any = <C, BCParams>(other: Optic<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return get.compose(other)
        case "maybeSelector":
          return MaybeSelector.create(get.compose(other.get), modify.compose(other.set))
        case "selector":
          return Selector.create(get.compose(other), modify.compose(other.set))
        case "maybeConverter":
          return MaybeSelector.create(get.compose(other.get), set.compose(other.reverseGet))
        case "converter":
          return Selector.create(get.compose(other.get), set.compose(other.reverseGet))
      }
    }

    const prop = Prop.implementation(compose)
    const indexBy = IndexBy.implementation(compose)
    const choose = Choose.implementation(compose)

    return {
      type: "selector",
      get,
      set,
      modify,
      compose,
      prop,
      indexBy,
      choose
    }
  }
}

