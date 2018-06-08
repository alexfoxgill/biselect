import { IndexBy } from "./IndexBy";
import { CertainPropOverloads, Prop } from "./Prop";
import { MaybeConverter } from "./MaybeConverter";
import { Choose } from "./Choose";

export interface Root<A> {
  indexBy: IndexBy<A, A, {}>
  prop: CertainPropOverloads<A, A, {}>
  choose<B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B, {}>
}

export namespace Root {
  export const create = <A>(): Root<A> => ({
    indexBy: IndexBy.implementation(x => x),
    prop: Prop.implementation(x => x),
    choose: Choose.implementation(x => x)
  })
}