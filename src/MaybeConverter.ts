import {Composable} from './Composable'
import {MaybeSelector} from './MaybeSelector'
import {Selector} from './Selector'
import {Converter} from './Converter'
import {Get, GetSignature} from './Get'
import {Set} from './Set'
import { Extension } from './Extension';
import { Memoize } from './Memoize';
import { Debug } from './Debug';
import { MaybeGet } from './MaybeGet';
import { Dimensionality, Structure } from './Discriminants';

export interface MaybeConverterCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeGet<B, C, BCParams>): MaybeGet<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): MaybeSelector<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): MaybeConverter<A, C, Params & BCParams>
}

export interface MaybeConverter<A, B, Params extends {} = {}> {
  _structure: Structure.Convert
  _dimensionality: Dimensionality.Maybe
  type: "maybeConverter"
  extend: (ext: Extension) => MaybeConverter<A, B, Params>

  get: MaybeGet<A, B, Params>
  reverseGet: Get<B, A, Params>
  compose: MaybeConverterCompose<A, B, Params>
  withDefault: (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)) => Converter<A, B, Params>
  withDefaultValue: (ifNull: B) => Converter<A, B, Params>
  memoize: () => MaybeConverter<A, B, Params>
  debug: () => MaybeConverter<A, B, Params>
}

export namespace MaybeConverter {
  export const fromGets = <A, B, Params extends {} = {}>(get: (a: A, p: Params) => B | null, reverseGet: (b: B, p: Params) => A) =>
    create(MaybeGet.create(get), Get.create(reverseGet))

  export const wrapSet = <A, B, C, ABParams, BCParams>(get: MaybeGet<A, B, ABParams>, reverseGet: Get<B, A, ABParams>, set: Set<B, C, BCParams>) =>
    Set.create<A, C, ABParams & BCParams>((a, p, c) => {
      const b = get._underlying(a, p)
      if (b === null) {
        return a
      } else {
        return reverseGet._underlying(set._underlying(b, p, c), p)
      }
    })

  export const create = <A, B, Params extends {} = {}>(get: MaybeGet<A, B, Params>, reverseGet: Get<B, A, Params>, ext: Extension = Extension.none): MaybeConverter<A, B, Params> => {
    get = get.extend(ext)
    reverseGet = reverseGet.extend(ext)
    
    const extend = (newExtension: Extension) => 
      create(get, reverseGet, Extension.combine(ext, newExtension))

    const compose: any = <C, BCParams>(other: Composable<B, C, BCParams>) => {
      if (Composable.is(Dimensionality.Single, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Get, other)) {
        return get.compose(other)
      } else if (Composable.is(Dimensionality.Single, Structure.Select, other)) {
        return MaybeSelector.create(get.compose(other), wrapSet(get, reverseGet, other.set), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Select, other)) {
        return MaybeSelector.create(get.compose(other), wrapSet(get, reverseGet, other.set), ext)
      } else if (Composable.is(Dimensionality.Single, Structure.Convert, other)) {
        return create(get.compose(other), other.reverseGet.compose(reverseGet), ext)
      } else if (Composable.is(Dimensionality.Maybe, Structure.Convert, other)) {
        return create(get.compose(other), other.reverseGet.compose(reverseGet), ext)
      }
    }

    const withDefault = (ifNull: (GetSignature<A, B, Params> | Get<A, B, Params>)): Converter<A, B, Params> =>
      Converter.create<A, B, Params>(get.withDefault(ifNull), reverseGet, ext)

    const withDefaultValue = (ifNull: B): Converter<A, B, Params> =>
      withDefault(Get.create<A, B, Params>(_ => ifNull, ext))

    const maybeConverter: MaybeConverter<A, B, Params> = {
      _structure: Structure.Convert,
      _dimensionality: Dimensionality.Maybe,
      type: "maybeConverter",
      extend,
      get,
      reverseGet,
      compose,
      withDefault,
      withDefaultValue,
      memoize: () => extend(Memoize()),
      debug: () => extend(Debug())
    }

    ext.apply(maybeConverter)

    return maybeConverter
  }
}

