import { MaybeSelector } from "./MaybeSelector";
import { Selector } from ".";
import { Get } from "./Get";
import { Set } from "./Set";

export type IndexBy<A, B, Params> =
  B extends { [key: string]: infer C }
  ? <K extends string>(key: K) => MaybeSelector<A, C, Params & { [Key in K]: string }>
  : never

export namespace IndexBy {
  const nullIfUndefined = <T>(x: T) => x === undefined ? null : x

  export const create = <A extends { [key: string]: B }, B, K extends string>(key: K): MaybeSelector<A, B, { [Key in K]: string }> =>
    MaybeSelector.create<A, B, { [Key in K]: string }>(
      Get.create((a, params) => nullIfUndefined(a[params[key]])),
      Set.create((a, params, b) => ({ ...a as any, [params[key]]: b })))

  export const implementation = (compose: (indexBy: any) => any): any =>
    (key: any) => compose(create(key))
}