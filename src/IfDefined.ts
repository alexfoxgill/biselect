import { Get } from "./Get"
import { MaybeGet } from "./MaybeGet";
import { MaybeSelector } from "./MaybeSelector";
import { Selector } from "./Selector";
import { Choose } from "./Choose";

export type IfOptional<T, U> = undefined extends T ? U : null extends T ? U : never

export type GetIfDefinedOverloads<A, B, Params> = IfOptional<B, {
  (): MaybeGet<A, Exclude<B, null | undefined>, Params>
  (defaultValue: B): Get<A, Exclude<B, null | undefined>, Params>
}>

export type MaybeGetIfDefinedOverloads<A, B, Params> = IfOptional<B, {
  (): MaybeGet<A, Exclude<B, null | undefined>, Params>
  (defaultValue: B): MaybeGet<A, Exclude<B, null | undefined>, Params>
}>

export type SelectorIfDefinedOverloads<A, B, Params> = IfOptional<B, {
  (): MaybeSelector<A, Exclude<B, null | undefined>, Params>
  (defaultValue: B): Selector<A, Exclude<B, null | undefined>, Params>
}>

export type MaybeSelectorIfDefinedOverloads<A, B, Params> = IfOptional<B, {
  (): MaybeSelector<A, Exclude<B, null | undefined>, Params>
  (defaultValue: B): MaybeSelector<A, Exclude<B, null | undefined>, Params>
}>

export namespace IfDefined {
  export const typeGuard = <A>(x: A): x is Exclude<A, undefined | null> => x !== undefined && x !== null

  export const implementation = (compose: (choose: any) => any): any =>
    (defaultValue?: any) => compose(Choose.create(typeGuard, defaultValue))
}