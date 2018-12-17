import { IndexBy, IndexByOverloads } from "./IndexBy";
import { SelectorPropOverloads, Prop } from "./Prop";
import { MaybeConverter } from "./MaybeConverter";
import { Choose } from "./Choose";
import { Extension } from "./Extension";
import { Memoize } from "./Memoize";
import { Debug } from "./Debug";
import { Dimensionality, Structure } from './Discriminants';

export interface Root<A> {
  indexBy: IndexByOverloads<Dimensionality.Single, Structure.Convert, A, A, {}>
  prop: SelectorPropOverloads<A, A>
  choose<B extends A>(typeGuard: (a: A) => a is B): MaybeConverter<A, B>
  extend: (newExt: Extension) => Root<A>
  memoize: () => Root<A>
  debug: () => Root<A>
}

export namespace Root {
  export const create = <A>(ext: Extension = Extension.none): Root<A> => ({
    indexBy: (key: string, defaultValue?: any) => IndexBy.create(key, defaultValue).extend(ext),
    prop: (...props: string[]) => Prop.many(...props).extend(ext),
    choose: <B extends A>(typeGuard: (a: A) => a is B) => Choose.create(typeGuard).extend(ext),
    extend: (newExt: Extension) => create<A>(Extension.combine(ext, newExt)),
    memoize() { return this.extend(Memoize()) },
    debug() { return this.extend(Debug()) }
  }) as any
}