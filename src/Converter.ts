import { Composable } from './Optic'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Get } from './Get'
import { Set } from './Set'
import { Extension } from './Extension';

export interface ConverterCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Selector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Converter<A, C, Params & BCParams>
}

export interface Converter<A, B, Params extends {}> {
  type: "converter"
  extend: (ext: Extension) => Converter<A, B, Params>

  get: Get<A, B, Params>
  reverseGet: Get<B, A, Params>
  compose: ConverterCompose<A, B, Params>
}

export namespace Converter {

  export const fromGets = <A, B, Params>(get: (a: A, p: Params) => B, reverseGet: (b: B, p: Params) => A) =>
    create(Get.create(get), Get.create(reverseGet))


  export const create = <A, B, Params>(get: Get<A, B, Params>, reverseGet: Get<B, A, Params>, ext: Extension = Extension.none): Converter<A, B, Params> => {
    get = get.extend(ext)
    reverseGet = reverseGet.extend(ext)
    
    const wrapSet = <A, B, C, ABParams, BCParams>(get: Get<A, B, ABParams>, reverseGet: Get<B, A, ABParams>, set: Set<B, C, BCParams>) =>
      Set.create<A, C, ABParams & BCParams>((a, p, c) => reverseGet._underlying(set._underlying(get._underlying(a, p), p, c), p))

    const extend = (newExtension: Extension) => 
      create(get, reverseGet, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.composeMaybe(get, other).extend(ext)
        case "maybeSelector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set), ext)
        case "selector":
          return MaybeSelector.create(Get.composeMaybe(get, other.get), wrapSet(get, reverseGet, other.set), ext)
        case "maybeConverter":
          return MaybeConverter.create(get.compose(other.get), other.reverseGet.compose(reverseGet), ext)
        case "converter":
          return create(get.compose(other.get), other.reverseGet.compose(reverseGet), ext)
      }
    }

    const converter: Converter<A, B, Params> = {
      type: "converter",
      extend,
      get,
      reverseGet,
      compose
    }

    ext.extend(converter)

    return converter
  }
}