import { expect } from 'chai'
import 'mocha'
import { IndexBy } from './IndexBy';

describe("IndexBy", () => {
  it("retrieves the result from an object using the given parameter", () => {
    const maybeSelector = IndexBy.create<{ [key: string]: number }, number, 'id'>('id')

    const result = maybeSelector.get({ 'a': 1, 'b': 2 }, { id: 'b' })
    expect(result).to.equal(2)    
  })

  it("returns null when the id is missing", () => {
    const maybeSelector = IndexBy.create<{ [key: string]: number }, number, 'id'>('id')

    const result = maybeSelector.get({ 'a': 1, 'b': 2 }, { id: 'c' })
    expect(result).to.be.null
  })
})