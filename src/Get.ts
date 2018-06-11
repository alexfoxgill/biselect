import { Composable } from './Optic'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { GetPropOverloads, Prop } from './Prop'
import { Extension } from './Extension';

export type GetSignature<A, B, Params extends {}> =
  {} extends Params
  ? (a: A) => B
  : (a: A, params: Params) => B

export interface GetCompose<A, B, Params> {
  <C, BCParams>(other: Get<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeSelector<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: Selector<B, C, BCParams>): Get<A, C, Params & BCParams>
  <C, BCParams>(other: MaybeConverter<B, C, BCParams>): Get<A, C | null, Params & BCParams>
  <C, BCParams>(other: Converter<B, C, BCParams>): Get<A, C, Params & BCParams>
}

export type Get<A, B, Params extends {}> = GetSignature<A, B, Params> & {
  type: "get"
  _underlying: (a: A, params: Params) => B
  extend: (ext: Extension) => Get<A, B, Params>

  compose: GetCompose<A, B, Params>
  map: <C>(f: (b: B) => C) => Get<A, C, Params>
  prop: GetPropOverloads<A, B, Params>
}

export namespace Get {
  export const create = <A, B, Params extends {}>(get: (a: A, p: Params) => B, ext: Extension = Extension.none): Get<A, B, Params> => {
    const clone: any = (...args: any[]) => clone._underlying(...args)
    clone.type = "get"
    clone._underlying = (a: A, p: Params) => get(a, p)
    
    clone.extend = (newExtension: Extension) => 
      create(get, Extension.combine(ext, newExtension))

    clone.compose = <C, BCParams extends {}>(other: Composable<B, C, BCParams>) => {
      switch (other.type) {
        case "get":
          return Get.create<A, C, Params & BCParams>((a, p) => other._underlying(clone(a, p), p), ext)
        case "maybeSelector":
        case "selector":
        case "maybeConverter":
        case "converter":
          return clone.compose(other.get)
      }
    }

    clone.map = <C>(f: (b: B) => C): Get<A, C, Params> =>
      Get.create((a, p) => f(clone(a, p)), ext)

    clone.prop = Prop.implementation(clone.compose)

    ext.extend(clone)

    return clone as Get<A, B, Params>
  }

  export const composeMaybe = <A, B, C, ABParams, BCParams>(ab: Get<A, B | null, ABParams>, bc: Get<B, C, BCParams>): Get<A, C | null, ABParams & BCParams> =>
    Get.create<A, C | null, ABParams & BCParams>((a, p) => {
      const b = ab._underlying(a, p)
      return b === null || b === undefined ? null : bc._underlying(b, p)
    })
}