import {Optic} from './Optic'
import {MaybeSelector} from './MaybeSelector'
import {Selector} from './Selector'
import {Converter} from './Converter'
import {Get, GetSignature} from './Get'
import {Set} from './Set'

export interface MaybeConverterCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
}

export interface MaybeConverter<A, B, Params extends {}> {
  type: "maybeConverter"
  get: Get<A, B | null, Params>
  reverseGet: Get<B, A, Params>
  compose: MaybeConverterCompose<A, B, Params>
  withDefault: (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)) => Converter<A, B, Params>
  withDefaultValue: (ifNull: B) => Converter<A, B, Params>
}

export namespace MaybeConverter {
  export const fromGets = <A, B, Params>(get: (a: A, p: Params) => B | null, reverseGet: (b: B, p: Params) => A) =>
    create(Get.create(get), Get.create(reverseGet))

  export const wrapSet = <A, B, C, ABParams, BCParams>(get: Get<A, B | null, ABParams>, reverseGet: Get<B, A, ABParams>, set: Set<B, C, BCParams>) =>
    Set.create<A, C, ABParams & BCParams>((a, p, c) => {
      const b = get._actual(a, p)
      if (b === null) {
        return a
      } else {
        return reverseGet._actual(set._actual(b, p, c), p)
      }
    })

  export const create = <A, B, Params>(get: Get<A, B | null, Params>, reverseGet: Get<B, A, Params>): MaybeConverter<A, B, Params> => {
    const compose: any = <C, BCParams>(other: Optic<B, C, BCParams>) => {
      switch(other.type) {
        case "get":
          return Get.composeMaybe(get, other)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set))
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set))
        case "maybeConverter":
          return create(Get.composeMaybe(get, other.get), other.reverseGet.compose(reverseGet))
        case "converter":
          return create(Get.composeMaybe(get, other.get), other.reverseGet.compose(reverseGet))
      }
    }

    const withDefault = (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)): Converter<A, B, Params> =>
      Converter.create(Get.create<A, B, Params>(ifNull), reverseGet)

    const withDefaultValue = (ifNull: B): Converter<A, B, Params> =>
      withDefault(Get.create<A, B, Params>(_ => ifNull))

    return {
      type: "maybeConverter",
      get,
      reverseGet,
      compose,
      withDefault,
      withDefaultValue
    }
  }
}

