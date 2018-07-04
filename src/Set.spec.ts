import { expect } from 'chai'
import 'mocha'
import { Set } from './Set';
import { Get } from './Get';

describe("Set", () => {
  
  it("doesn't permit a param argument when Params is empty", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number>((foo, p, bar) => ({ bar }))
    const result = set({ bar: 1 }, 2)
    
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("requires and uses param argument when Params is not empty", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number, { add: number }>((foo, p, bar) => ({ bar: bar + p.add }))
    const result = set({ bar: 1 }, { add: 10 }, 2)
    
    expect(result).to.deep.equal({ bar: 12 })
  })

  describe(".mapParams()", () => {
    it("maps parameter object", () => {
      interface Foo { bar: number }
      const set = Set.create<Foo, number, { add: number }>((foo, p, bar) => ({ bar: bar + p.add }))
        .mapParams<{ toAdd: number }>(({toAdd}) => ({ add: toAdd }))
      const result = set({ bar: 1 }, { toAdd: 10 }, 2)
      
      expect(result).to.deep.equal({ bar: 12 })
    })
  })

  it("composes with Get", () => {
    interface Foo { bar: number }
    const set = Set.create<Foo, number>((foo, p, bar) => ({ bar }))
      .compose(Get.create((num: number) => num + 1))

    const result = set({ bar: 0 }, 10)

    expect(result).to.deep.equal({ bar: 11})
  })

  it("doesn't change object references if the update is a no-op", () => {
    interface Foo { bars: Bar[] }
    interface Bar { qux: number }

    const set = Set.create<Foo, Bar[]>((foo, _, bars) => ({ bars }))

    const foo = { bars: [{ qux: 1 }, { qux: 2 }] }
    const result = set(foo, [{ qux: 1 }, { qux: 2 }])
    expect(result).to.equal(foo)
  })
})