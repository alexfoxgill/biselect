import { Choose } from "./Choose";
import { Dimensionality, Structure } from "./Discriminants";
import { Composable } from "./Composable";

export type IfOptional<T, U> = undefined extends T ? U : null extends T ? U : never

export type IfDefinedOverloads<D extends Dimensionality, S extends Structure, A, B, Params extends {}> = IfOptional<B, {
  (): Composable.ComposeResult<A, Exclude<B, null | undefined>, Params, D, Dimensionality.Maybe, S, Structure.Convert>
  (defaultValue: B): Composable.ComposeResult<A, Exclude<B, null | undefined>, Params, D, Dimensionality.Single, S, Structure.Convert>
}>

export namespace IfDefined {
  export const typeGuard = <A>(x: A): x is Exclude<A, undefined | null> => x !== undefined && x !== null

  export const implementation = (compose: (choose: any) => any): any =>
    (defaultValue?: any) => compose(Choose.create(typeGuard, defaultValue))
}