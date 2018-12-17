import { MaybeSelector } from "./MaybeSelector";
import { Selector } from "./Selector";
import { GetSignature } from "./Get";
import { StringProperty } from "./util";
import { Composable } from "./Composable";
import { Dimensionality, Structure } from "./Discriminants";

export type IndexByOverloads<D extends Dimensionality, S extends Structure, A, B, Params extends {}> =
  B extends { [key: string]: infer C }
  ? {
    <K extends string>(key: K)
      : Composable.ComposeResult<A, C, Params & StringProperty<K>, D, Dimensionality.Maybe, S, Structure.Select>
    <K extends string>(key: K, defaultValue: C)
      : Composable.ComposeResult<A, C, Params & StringProperty<K>, D, Dimensionality.Single, S, Structure.Select>
    <K extends string>(key: K, getDefault: GetSignature<B, C, Params & StringProperty<K>>)
      : Composable.ComposeResult<A, C, Params & StringProperty<K>, D, Dimensionality.Single, S, Structure.Select>
  }
  : never

export namespace IndexBy {
  const nullIfUndefined = <T>(x: T) => x === undefined ? null : x

  export function create<A extends { [key: string]: B }, B, K extends string>(key: K): MaybeSelector<A, B, StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, K extends string>(key: K, defaultValue: B): Selector<A, B, StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, Params extends {}, K extends string>(key: K, getDefault: GetSignature<A, B, Params & StringProperty<K>>): Selector<A, B, Params & StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, Params extends {}, K extends string>(key: K, defaultValue?: B | GetSignature<A, B, Params>) {
    const selector = MaybeSelector.fromGetSet<A, B, StringProperty<K>>(
      (a, params) => nullIfUndefined(a[params[key]] as any as B),
      (a, params, b) => ({ ...a as any, [params[key]]: b }))

    if (defaultValue === undefined) {
      return selector
    } else if (typeof defaultValue === "function") {
      return selector.withDefault(defaultValue as any)
    } else {
      return selector.withDefaultValue(defaultValue)
    }
  }

  export const implementation = (compose: (indexBy: any) => any): any =>
    (key: any, defaultValue: any) => compose(create(key, defaultValue))
}