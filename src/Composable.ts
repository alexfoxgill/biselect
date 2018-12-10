import { Get } from './Get'
import { Set } from './Set'
import { MaybeGet } from './MaybeGet'
import { Modify } from './Modify'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'
import { Dimensionality, Structure } from './Discriminants'

export type Composable<A, B, Params extends {}> =
  | Get<A, B, Params>
  | MaybeGet<A, B, Params>
  | Selector<A, B, Params>
  | MaybeSelector<A, B, Params>
  | Converter<A, B, Params>
  | MaybeConverter<A, B, Params>

export namespace Composable {
  export type Any = Composable<any, any, any>

  export type WithDimensionality<A, B, P, D extends Dimensionality> =
    Extract<Composable<A, B, P>, { "_dimensionality" : D }>
  
  export type WithStructure<A, B, P, S extends Structure> =
    Extract<Composable<A, B, P>, { "_structure": S }>

  export type RootType<C extends Any> = C extends Composable<infer T, any, any> ? T : never

  // simplified after https://github.com/Microsoft/TypeScript/issues/28862
  export type FocusType<C extends Any> = 
    C extends WithDimensionality<any, infer B, any, Dimensionality.Maybe> ? B
    : C extends WithDimensionality<any, infer B, any, Dimensionality.Single> ? B
    : never

  export type ParamType<C extends Any> = C extends Composable<any, any, infer T> ? T : never

  export type ComposeResult<T extends Any, U extends Any> =
    Extract<Composable<RootType<T>, FocusType<U>, ParamType<T> & ParamType<U>>, {
      "_structure": Structure.Narrowest<T["_structure"], U["_structure"]>,
      "_dimensionality": Dimensionality.Highest<T["_dimensionality"], U["_dimensionality"]>
    }>

  export function is<D extends Dimensionality>(d: D, c: any): c is { "_dimensionality": D }
  export function is<S extends Structure>(s: S, c: any): c is { "_structure": S }
  export function is<D extends Dimensionality, S extends Structure>(d: D, s: S, c: any): c is { "_dimensionality": D, "_structure": S }
  export function is(d: Dimensionality | Structure, s: Structure | any, c?: any) {
    if (arguments.length === 3) {
      return c._dimensionality === d && c._structure === s
    } else if (Dimensionality.is(d)) {
      return s._dimensionality === d
    } else {
      return s._structure === d
    }
  }
}

export type All<A, B, Params extends {}> =
  | Composable<A, B, Params>
  | Set<A, B, Params>
  | Modify<A, B, Params>