import { MaybeConverter } from "./MaybeConverter"
import { Get } from "./Get"
import { MaybeGet } from "./MaybeGet";

export namespace Choose {

  export const create = <A, B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B> =>
    MaybeConverter.create<A, B>(MaybeGet.create(a => typeGuard(a) ? a : null), Get.create(b => b as A))

  export const implementation = (compose: (choose: any) => any): any =>
    (typeGuard: any) => compose(create(typeGuard))
}