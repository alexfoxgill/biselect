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

  export type Shape<D extends Dimensionality, S extends Structure> = 
    { "_structure": S, "_dimensionality": D }

  export type IsDimensionality<D extends Dimensionality> =
    { "_dimensionality" : D }

  export type IsStructure<S extends Structure> =
    { "_structure": S }

  export type RootType<C extends Any> = C extends Composable<infer T, any, any> ? T : never

  // simplified after https://github.com/Microsoft/TypeScript/issues/28862
  // export type FocusType<C extends Any> = C extends Composable<any, infer T, any> ? T : never
  export type FocusType<C extends Any> =
    C extends Extract<Composable<any, infer B, any>, IsDimensionality<Dimensionality.Maybe>> ? B
    : C extends Extract<Composable<any, infer B, any>, IsDimensionality<Dimensionality.Single>> ? B
    : never

  export type ParamType<C extends Any> = C extends Composable<any, any, infer T> ? T : never

  export type Summon<D extends Dimensionality, S extends Structure, A, B, Params extends {}> =
    Extract<Composable<A, B, Params>, Shape<D, S>>

  export type ComposeResult<A, B, P extends {}, D1 extends Dimensionality, D2 extends Dimensionality, S1 extends Structure, S2 extends Structure> =
    Extract<Composable<A, B, P>, ShapeResult<D1, D2, S1, S2>>

  export type ShapeResult<D1 extends Dimensionality, D2 extends Dimensionality, S1 extends Structure, S2 extends Structure> =
    Shape<Dimensionality.Highest<D1, D2>, Structure.Narrowest<S1, S2>>

  export function is<D extends Dimensionality>(d: D, c: any): c is IsDimensionality<D>
  export function is<S extends Structure>(s: S, c: any): c is IsStructure<S>
  export function is<D extends Dimensionality, S extends Structure>(d: D, s: S, c: any): c is Shape<D, S>
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