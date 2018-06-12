import {Composable} from './Transformer'
import {MaybeSelector} from './MaybeSelector'
import {Selector} from './Selector'
import {Converter} from './Converter'
import {Get, GetSignature} from './Get'
import {Set} from './Set'
import { Extension } from './Extension';

export interface MaybeConverterCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
}

export interface MaybeConverter<A, B, Params extends {}> {
  type: "maybeConverter"
  extend: (ext: Extension) => MaybeConverter<A, B, Params>

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
      const b = get._underlying(a, p)
      if (b === null) {
        return a
      } else {
        return reverseGet._underlying(set._underlying(b, p, c), p)
      }
    })

  export const create = <A, B, Params>(get: Get<A, B | null, Params>, reverseGet: Get<B, A, Params>, ext: Extension = Extension.none): MaybeConverter<A, B, Params> => {
    get = get.extend(ext)
    reverseGet = reverseGet.extend(ext)
    
    const extend = (newExtension: Extension) => 
      create(get, reverseGet, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      switch(other.type) {
        case "get":
          return Get.composeMaybe(get, other).extend(ext)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set), ext)
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set), ext)
        case "maybeConverter":
          return create(Get.composeMaybe(get, other.get), other.reverseGet.compose(reverseGet), ext)
        case "converter":
          return create(Get.composeMaybe(get, other.get), other.reverseGet.compose(reverseGet), ext)
      }
    }

    const withDefault = (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)): Converter<A, B, Params> => {
      const ifNullGet = Get.create<A, B, Params>(ifNull, ext)
      return Converter.create<A, B, Params>(Get.create((a, p) => {
        const b = get._underlying(a, p)
        return b === null || b === undefined ? ifNullGet._underlying(a, p): b
      }), reverseGet, ext)
    }

    const withDefaultValue = (ifNull: B): Converter<A, B, Params> =>
      withDefault(Get.create<A, B, Params>(_ => ifNull, ext))

    const maybeConverter: MaybeConverter<A, B, Params> = {
      type: "maybeConverter",
      extend,
      get,
      reverseGet,
      compose,
      withDefault,
      withDefaultValue
    }

    ext.apply(maybeConverter)

    return maybeConverter
  }
}

