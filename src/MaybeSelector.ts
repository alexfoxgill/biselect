import { Get } from './Get'
import { Set } from './Set'
import { Modify } from './Modify'
import { Optic } from './Optic'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'

export interface MaybeSelectorCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
}

export type MaybeSelector<A, B, Params extends {}> = {
  type: "maybeSelector"
  get: Get<A, B | null, Params>
  set: Set<A, B, Params>
  modify: Modify<A, B, Params>
  compose: MaybeSelectorCompose<A, B, Params>
}

export namespace MaybeSelector {
  export const create = <A, B, Params extends {}>(get: Get<A, B | null, Params>, set: Set<A, B, Params>): MaybeSelector<A, B, Params> => {
    const modify = Modify.fromMaybeGetSet(get, set)

    const compose: any = <C, BCParams>(other: Optic<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.composeMaybe(get, other)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), modify.compose(other.set))
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), modify.compose(other.set))
        case "maybeConverter":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), set.compose(other.reverseGet))
        case "converter":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), set.compose(other.reverseGet))
      }
    }

    return { type: "maybeSelector", get, set, modify, compose }
  }
}
