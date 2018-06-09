import { expect } from 'chai'
import 'mocha'
import { Combine } from './Combine';
import { Root } from './Root';

describe("Combine", () => {
  it("creates a selector", () => {
    interface Foo { bar: number, qux: string }
    const root = Root.create<Foo>()
    
    const selector = Combine.create<Foo>()
      .add('b', root.prop('bar'))
      .add('q', root.prop('qux'))

    const result = selector.get({ bar: 1, qux: "a" })
    expect(result).to.deep.equal({ b: 1, q: "a" })
  })
})