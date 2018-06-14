import { MaybeSelector } from "./MaybeSelector";
import { Selector } from "./Selector";
import { Get } from "./Get";
import { Set } from "./Set";

export type IndexBy<A, B, Params extends {} = {}> =
  B extends { [key: string]: infer C }
  ? IndexByOverloads<A, C, Params>
  : never

export interface IndexByOverloads<A, C, Params> {
  <K extends string>(key: K): MaybeSelector<A, C, Params & { [Key in K]: string }>
  <K extends string>(key: K, defaultValue: C): Selector<A, C, Params & { [Key in K]: string }>
}

export type IndexByMaybe<A, B, Params extends {} = {}> =
  B extends { [key: string]: infer C }
  ? IndexByMaybeOverloads<A, C, Params>
  : never

export interface IndexByMaybeOverloads<A, C, Params> {
  <K extends string>(key: K): MaybeSelector<A, C, Params & { [Key in K]: string }>
  <K extends string>(key: K, defaultValue: C): MaybeSelector<A, C, Params & { [Key in K]: string }>
}

export namespace IndexBy {
  const nullIfUndefined = <T>(x: T) => x === undefined ? null : x

  export function create<A extends { [key: string]: B }, B, K extends string>(key: K): MaybeSelector<A, B, { [Key in K]: string }>
  export function create<A extends { [key: string]: B }, B, K extends string>(key: K, defaultValue: B): Selector<A, B, { [Key in K]: string }>
  export function create<A extends { [key: string]: B }, B, K extends string>(key: K, defaultValue?: B) {
    const selector = MaybeSelector.fromGetSet<A, B, { [Key in K]: string }>(
      (a, params) => nullIfUndefined(a[params[key]]),
      (a, params, b) => ({ ...a as any, [params[key]]: b }))

    if (defaultValue === undefined) {
      return selector
    } else {
      return selector.withDefaultValue(defaultValue)
    }
  }

  export const implementation = (compose: (indexBy: any) => any): any =>
    (key: any, defaultValue: any) => compose(create(key, defaultValue))
}