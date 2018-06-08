import { Optic } from './Optic'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Get } from './Get'
import { Set } from './Set'

export interface ConverterCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Converter<A, C, Params & BCParams>
}

export interface Converter<A, B, Params extends {}> {
  type: "converter"
  get: Get<A, B, Params>
  reverseGet: Get<B, A, Params>
  compose: ConverterCompose<A, B, Params>
}

export namespace Converter {
  export const fromGets = <A, B, Params>(get: (a: A, p: Params) => B, reverseGet: (b: B, p: Params) => A) =>
    create(Get.create(get), Get.create(reverseGet))

  export const wrapSet = <A, B, C, ABParams, BCParams>(get: Get<A, B, ABParams>, reverseGet: Get<B, A, ABParams>, set: Set<B, C, BCParams>) =>
    Set.create<A, C, ABParams & BCParams>((a, p, c) => reverseGet._actual(set._actual(get._actual(a, p), p, c), p))

  export const create = <A, B, Params>(get: Get<A, B, Params>, reverseGet: Get<B, A, Params>): Converter<A, B, Params> => {
    const compose: any = <C, BCParams>(other: Optic<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.composeMaybe(get, other)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set))
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set))
        case "maybeConverter":
          return MaybeConverter.create(get.compose(other.get), other.reverseGet.compose(reverseGet))
        case "converter":
          return create(get.compose(other.get), other.reverseGet.compose(reverseGet))
      }
    }
    return { type: "converter", get, reverseGet, compose }
  }
}