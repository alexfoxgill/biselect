import { MaybeConverter } from "./MaybeConverter"
import { Get, GetSignature } from "./Get"
import { MaybeGet } from "./MaybeGet";
import { Composable } from "./Composable";
import { Dimensionality, Structure } from "./Discriminants";

export interface ChooseOverloads<D extends Dimensionality, S extends Structure, A, B, Params extends {}> {
  <C extends B>(pred: (b: B) => b is C)
    : Composable.ComposeResult<A, C, Params, D, Dimensionality.Maybe, S, Structure.Convert>

  <C extends B>(pred: (b: B) => b is C, defaultValue: C)
    : Composable.ComposeResult<A, C, Params, D, Dimensionality.Single, S, Structure.Convert>
    
  <C extends B>(pred: (b: B) => b is C, getDefault: GetSignature<B, C, Params>)
    : Composable.ComposeResult<A, C, Params, D, Dimensionality.Single, S, Structure.Convert>
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