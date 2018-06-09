import { expect } from 'chai'
import 'mocha'
import { Root } from './Root';

describe("Root", () => {
  it("can create a nested prop selector", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number }
    const selector = Root.create<Foo>().prop('bar', 'qux')

    const result = selector.get({ bar: { qux: 1 } })
    expect(result).to.equal(1)
  })

  it("can create an index selector on a lookup object", () => {
    const maybeSelector = Root.create<{ [key: string]: number }>().indexBy('id')

    const result = maybeSelector.get({ 'a': 1, 'b': 2 }, { id: 'b' })
    expect(result).to.equal(2)    
  })

  it("can create a chooser", () => {
    const isString = (a: any): a is string => typeof a === "string"
    const maybeConverter = Root.create<string | number>().choose(isString)

    const result = maybeConverter.get("a")
    expect(result).to.equal("a")

    const nullResult = maybeConverter.get(1)
    expect(nullResult).to.be.null
  })
})