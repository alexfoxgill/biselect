import { Selector } from "./Selector";
import { Root } from "./Root";

export interface CombinedSelectorRoot<A> {
  add: <K extends string, B, Params>(name: K, selector: Selector<A, B, Params>) => CombinedSelector<A, { [KK in K]: B }, Params>
}

export interface CombinedSelector<A, Result, Params> extends Selector<A, Result, Params> {
  add: <K extends string, B, NewParams>(name: K, selector: Selector<A, B, NewParams>) =>
    K extends keyof Result
    ? never
    : CombinedSelector<A, Result & { [KK in K]: B }, Params & NewParams>
}

export namespace Combine {

  const fromSelector = <A, B, Params>(selector: Selector<A, B, Params>): CombinedSelector<A, B, Params> => {
    const asCombined = selector as any
    asCombined.add = <K extends string, B, NewParams>(name: K, other: Selector<A, B, NewParams>) => {
      const nested = Selector.fromGetSet<A, any, Params & NewParams>(
        (a, p) => ({ ...selector.get._underlying(a, p) as any, [name]: other.get._underlying(a, p) }),
        (a, p, b) => other.set._underlying(selector.set._underlying(a, p, b), p, b[name]))
      return fromSelector(nested)
    }
    return asCombined
  }

  export const create = <A>(): CombinedSelectorRoot<A> => ({
    add: <K extends string, B, NewParams>(name: K, selector: Selector<A, B, NewParams>) => {
      const combined = Selector.fromGetSet<A, any, NewParams>(
        (a, p) => ({ [name]: selector.get._underlying(a, p)}),
        (a, p, b) => selector.set._underlying(a, p, b[name]))

      return fromSelector(combined)
    }
  })
}