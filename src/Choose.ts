import { MaybeConverter } from "./MaybeConverter"
import { Get, GetSignature } from "./Get"
import { MaybeGet } from "./MaybeGet";
import { MaybeSelector } from "./MaybeSelector";
import { Selector } from "./Selector";

export interface GetChooseOverloads<A, B, Params> {
  <C extends B>(pred: (b: B) => b is C): MaybeGet<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, defaultValue: C): Get<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, getDefault: GetSignature<B, C, Params>): Get<A, C, Params>
}

export interface MaybeGetChooseOverloads<A, B, Params> {
  <C extends B>(pred: (b: B) => b is C): MaybeGet<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, defaultValue: C): MaybeGet<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, getDefault: GetSignature<B, C, Params>): MaybeGet<A, C, Params>
}

export interface SelectorChooseOverloads<A, B, Params> {
  <C extends B>(pred: (b: B) => b is C): MaybeSelector<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, defaultValue: C): Selector<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, getDefault: GetSignature<B, C, Params>): Selector<A, C, Params>
}

export interface MaybeSelectorChooseOverloads<A, B, Params> {
  <C extends B>(pred: (b: B) => b is C): MaybeSelector<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, defaultValue: C): MaybeSelector<A, C, Params>
  <C extends B>(pred: (b: B) => b is C, getDefault: GetSignature<B, C, Params>): MaybeSelector<A, C, Params>
}

export namespace Choose {

  export const create = <A, B extends A>(typeGuard: (a: A) => a is B, defaultValue?: B | GetSignature<A, B, any>) => {
    const converter = MaybeConverter.create<A, B>(
      MaybeGet.create(a => typeGuard(a) ? a : null),
      Get.create(b => b as A))

    if (defaultValue === undefined) {
      return converter
    } else if (typeof defaultValue === "function") {
      return converter.withDefault(defaultValue as any)
    } else {
      return converter.withDefaultValue(defaultValue)
    }
  }

  export const implementation = (compose: (choose: any) => any): any =>
    (typeGuard: any, defaultValue: any) => compose(create(typeGuard, defaultValue))
}