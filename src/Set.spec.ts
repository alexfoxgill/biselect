import { expect } from 'chai'
import 'mocha'
import { Set } from './Set';
import { Get } from './Get';

describe("Set", () => {
  
  it("doesn't permit a param argument when Params is empty", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number, {}>((foo, p, bar) => ({ bar }))
    const result = set({ bar: 1 }, 2)
    
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("requires and uses param argument when Params is not empty", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number, { add: number }>((foo, p, bar) => ({ bar: bar + p.add }))
    const result = set({ bar: 1 }, { add: 10 }, 2)
    
    expect(result).to.deep.equal({ bar: 12 })
  })

  it("composes with Get", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number, {}>((foo, p, bar) => ({ bar }))
      .compose(Get.create((num: number) => num + 1))

    const result = set({ bar: 0 }, 10)

    expect(result).to.deep.equal({ bar: 11})
  })

})