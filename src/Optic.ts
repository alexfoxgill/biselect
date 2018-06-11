import { Get } from './Get'
import { Set } from './Set'
import { Modify } from './Modify'
import { MaybeSelector } from './MaybeSelector'
import { Selector } from './Selector'
import { MaybeConverter } from './MaybeConverter'
import { Converter } from './Converter'

export type Composable<A, B, Params extends {}> =
  Get<A, B, Params>
  | MaybeSelector<A, B, Params>
  | Selector<A, B, Params>
  | MaybeConverter<A, B, Params>
  | Converter<A, B, Params>

export type All<A, B, Params extends {}> =
  Get<A, B, Params>
  | Set<A, B, Params>
  | Modify<A, B, Params>
  | MaybeSelector<A, B, Params>
  | Selector<A, B, Params>
  | MaybeConverter<A, B, Params>
  | Converter<A, B, Params>