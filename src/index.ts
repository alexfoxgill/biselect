import { Combine, CombinedSelectorRoot } from './Combine';
import { Root } from './Root';
import { Get } from './Get'
import { Extension } from './Extension'

export { Extension, Combine }
export { Selector } from './Selector'
export { MaybeSelector } from './MaybeSelector'
export { Converter } from './Converter'
export { MaybeConverter } from './MaybeConverter'
export { Get } from './Get'
export { Set } from './Set'
export { Modify } from './Modify'

export namespace Biselect {
  export const get = Get.create
  export const from = <A>(): Root<A> => Root.create<A>()
  export const combine = <A>() => Combine.create<A>()
}