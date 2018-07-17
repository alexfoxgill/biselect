import { MaybeSelector } from "./MaybeSelector";
import { Selector } from "./Selector";
import { GetSignature } from "./Get";

type StringProperty<K extends string> = { [Key in K]: string }

export type IndexBy<A, B, Params extends {} = {}> =
  B extends { [key: string]: infer C }
  ? IndexByOverloads<A, B, C, Params>
  : never

export interface IndexByOverloads<A, B, C, Params> {
  <K extends string>(key: K): MaybeSelector<A, C, Params & StringProperty<K>>
  <K extends string>(key: K, defaultValue: C): Selector<A, C, Params & StringProperty<K>>
  <K extends string>(key: K, getDefault: GetSignature<B, C, Params & StringProperty<K>>): Selector<A, C, Params & StringProperty<K>>
}

export type IndexByMaybe<A, B, Params extends {} = {}> =
  B extends { [key: string]: infer C }
  ? IndexByMaybeOverloads<A, B, C, Params>
  : never

export interface IndexByMaybeOverloads<A, B, C, Params> {
  <K extends string>(key: K): MaybeSelector<A, C, Params & StringProperty<K>>
  <K extends string>(key: K, defaultValue: C): MaybeSelector<A, C, Params & StringProperty<K>>
  <K extends string>(key: K, getDefault: GetSignature<B, C, Params & StringProperty<K>>): MaybeSelector<A, C, Params & StringProperty<K>>
}

export namespace IndexBy {
  const nullIfUndefined = <T>(x: T) => x === undefined ? null : x

  export function create<A extends { [key: string]: B }, B, K extends string>(key: K): MaybeSelector<A, B, StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, K extends string>(key: K, defaultValue: B): Selector<A, B, StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, Params extends {}, K extends string>(key: K, getDefault: GetSignature<A, B, Params & StringProperty<K>>): Selector<A, B, Params & StringProperty<K>>
  export function create<A extends { [key: string]: B }, B, Params extends {}, K extends string>(key: K, defaultValue?: B | GetSignature<A, B, Params>) {
    const selector = MaybeSelector.fromGetSet<A, B, StringProperty<K>>(
      (a, params) => nullIfUndefined(a[params[key]]),
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