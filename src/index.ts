import { Combine, CombinedSelectorRoot } from './Combine';
import { Root } from './Root';

export namespace Biselect {
  export const from = <A>(): Root<A> => Root.create<A>()
  export const combine = <A>() => Combine.create<A>()
}