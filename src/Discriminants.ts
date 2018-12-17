export enum Dimensionality {
  Single = "single",
  Maybe = "maybe"
}

export namespace Dimensionality {
  export type Highest<T extends Dimensionality, U extends Dimensionality> =
    Dimensionality extends T ? never
    : Dimensionality extends U ? never
    : Dimensionality.Maybe extends (T | U) ? Dimensionality.Maybe
    : Dimensionality.Single extends (T | U) ? Dimensionality.Single
    : never

  export const is = (x: any): x is Dimensionality => Object.keys(Dimensionality).map((x: any) => Dimensionality[x]).indexOf(x) != -1
}

export enum Structure {
  Get = "get",
  Select = "select",
  Convert = "convert"
}

export namespace Structure {
  export type Narrowest<T extends Structure, U extends Structure> =
    Structure extends T ? never
    : Structure extends U ? never
    : Structure.Get extends (T | U) ? Structure.Get
    : Structure.Select extends (T | U) ? Structure.Select
    : Structure.Convert extends (T | U) ? Structure.Convert
    : never 

  export const is = (x: any): x is Structure => Object.keys(Structure).map((x: any) => Structure[x]).indexOf(x) != -1
}