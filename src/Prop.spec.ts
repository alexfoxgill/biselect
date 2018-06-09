import { expect } from 'chai'
import 'mocha'
import { Prop } from './Prop';

describe("Prop", () => {
  it("creates a selector to the given property", () => {
    interface Foo { bar: number }
    const selector = Prop.create<Foo, 'bar'>('bar')

    const result = selector.get({ bar: 1 })
    expect(result).to.equal(1)
  })
})