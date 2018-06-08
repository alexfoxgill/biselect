import { expect } from 'chai'
import 'mocha'
import { DeepPartial } from "./DeepPartial";

describe("DeepPartial", () => {
  describe("merge", () => {
    it("returns the argument if a string", () => {
      const result = DeepPartial.merge<string>("a", "b")

      expect(result).to.equal("b")
    })

    it("returns the argument if a number", () => {
      const result = DeepPartial.merge<number>(1, 2)

      expect(result).to.equal(2)
    })

    it("performs a shallow merge", () => {
      const result = DeepPartial.merge({ a: 1, b: 2 }, { b: 3 })

      expect(result).to.deep.equal({ a: 1, b: 3 })
    })

    it("performs a deep merge", () => {
      const result = DeepPartial.merge({ a: 1, b: { c: 3, d: 4 }}, { b: { c: 5 } })

      expect(result).to.deep.equal({ a: 1, b: { c: 5, d: 4 }})
    })
  })
})