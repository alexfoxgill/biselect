import { expect } from 'chai'
import 'mocha'
import { Modify } from './Modify';

describe("Modify", () => {
  it("modifies", () => {
    interface Foo { bar: number }
    const modify = Modify.create<Foo, number, {}>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify({ bar: 1 }, x => x + 1)
    expect(result).to.deep.equal({ bar: 2 })
  })

  it("merges", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: string }
    const modify = Modify.create<Foo, Bar, {}>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.merge({ bar: { qux: 1, sha: "pow" }  }, { qux: 2 })
    expect(result).to.deep.equal({ bar: { qux: 2, sha: "pow" }})
  })

  it("deep merges", () => {
    interface Foo { bar: Bar }
    interface Bar { qux: number, sha: Sha }
    interface Sha {
      pow: string
      ping: number
    }
    const modify = Modify.create<Foo, Bar, {}>((foo, p, f) => ({ bar: f(foo.bar) }))

    const result = modify.deepMerge({ bar: { qux: 1, sha: { pow: "pow", ping: 1 } } }, { sha: { ping: 2 } })
    expect(result).to.deep.equal({ bar: { qux: 1, sha: { pow: "pow", ping: 2 } } })

  })
})