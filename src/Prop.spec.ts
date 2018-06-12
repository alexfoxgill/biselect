import { expect } from 'chai'
import 'mocha'
import { Prop } from './Prop';

describe("Prop", () => {
  it("creates a selector to the given property", () => {
    interface Foo { bar: number }
    const selector = Prop.create<Foo, 'bar'>('bar')

    const result = selector.modify({ bar: 1 }, x => x + 1)
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("returns the same object if the set is a no-op", () => {
    interface Foo { bar: number }
    
    const foo = { bar: 1 }
    const selector = Prop.create<Foo, 'bar'>('bar')
    const result = selector.modify(foo, x => x)
    expect(result).to.equal(foo)
  })
})