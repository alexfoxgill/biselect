import { Combine, CombinedSelectorRoot } from './Combine';
import { Root } from './Root';

export namespace Biselect {
  export const from = <A>(): Root<A> => Root.create<A>()
  export const combine = <A>() => Combine.create<A>()
}

export {Selector} from './Selector'
export {MaybeSelector} from './MaybeSelector'
export {Converter} from './Converter'
export {MaybeConverter} from './MaybeConverter'
export {Get} from './Get'
export {Set} from './Set'
export {Modify} from './Modify'