import { Combine } from './Combine';
import { Root } from './Root';
import { Get } from './Get'

export namespace Biselect {
  export const get = Get.create
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