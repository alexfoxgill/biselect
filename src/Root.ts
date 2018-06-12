import { IndexBy } from "./IndexBy";
import { SelectorPropOverloads, Prop } from "./Prop";
import { MaybeConverter } from "./MaybeConverter";
import { Choose } from "./Choose";
import { Extension } from "./Extension";

export interface Root<A> {
  indexBy: IndexBy<A, A>
  prop: SelectorPropOverloads<A, A>
  choose<B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B>
  extend: (newExt: Extension) => Root<A>
}

export namespace Root {
  export const create = <A>(ext: Extension = Extension.none): Root<A> => ({
    indexBy: (key: string) => IndexBy.create(key).extend(ext),
    prop: (...props: string[]) => Prop.many(...props).extend(ext),
    choose: <B extends A>(typeGuard: (a: A) => a is B) => Choose.create(typeGuard).extend(ext),
    extend: (newExt: Extension) => create<A>(Extension.combine(ext, newExt))
  }) as any
}