import { expect } from 'chai'
import 'mocha'
import { Choose } from './Choose';

describe("Choose", () => {
  it("creates a MaybeConverter", () => {
    const isString = (a: any): a is string => typeof a === "string"
    const maybeConverter = Choose.create<string | number, string>(isString)

    const result = maybeConverter.get("a")
    expect(result).to.equal("a")

    const nullResult = maybeConverter.get(1)
    expect(nullResult).to.be.null
  })
})