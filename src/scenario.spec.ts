import { expect } from 'chai';
import 'mocha';
import {Biselect} from './index'
import {indexBy, Lookup} from './util'
import { Memoize } from './Memoize';

type UserId = string
type DocumentId = string

interface Domain {
  users: { [userId: string]: User }
  documents: { [docId: string]: Doc }
  permissions: {
    [userId: string]: {
      [docId: string]: Permission[]
    }
  }
}

interface User {
  id: UserId
  email: string
}

interface TableDocument {
  id: DocumentId
  type: "table"
  name: string
  table: {
    columns: string[],
    rows: string[][]
  }
}

interface TextDocument {
  id: DocumentId
  type: "text"
  name: string
  text: string
}

type Doc = TableDocument | TextDocument

module Doc {
  export const isTable = (doc: Doc): doc is TableDocument => doc.type === "table"
  export const isText = (doc: Doc): doc is TextDocument => doc.type === "text"
}

enum Permission {
  Owner,
  Write,
  Read,
}

const aaron: User = {
  id: "u-aaron",
  email: "aaron@aardvark.com"
}

const beatrice: User = {
  id: "u-beatrice",
  email: "beatrice@bobcat.com"
}

const users = [aaron, beatrice]

const todoTextDoc: TextDocument = {
  id: "doc-10239431",
  type: "text",
  name: "todo.txt",
  text: "- implement unit tests\n- publish to npm\n"
}

const todoTableDoc: TableDocument = {
  id: "doc-12340943",
  type: "table",
  name: "tasks.csv",
  table: {
    columns: ["task", "status"],
    rows: [
      ["implement unit tests", "doing"],
      ["publish to npm", "done"]
    ]
  }
}

const documents = [todoTextDoc, todoTableDoc]

const root: Domain = {
  users: indexBy(users, 'id'),
  documents: indexBy(documents, 'id'),
  permissions: {
    [aaron.id]: {
      [todoTextDoc.id]: [Permission.Owner]
    },
    [beatrice.id]: {
      [todoTableDoc.id]: [Permission.Owner]
    }
  }
}

describe("Users/Documents scenario", () => {
  const fromRoot = Biselect.from<Domain>().extend(Memoize())
  const userSelector = fromRoot.prop('users').indexBy('userId')
  const docSelector = fromRoot.prop('documents').indexBy('docId')
  const permissionSelector = fromRoot.prop('permissions').indexBy('userId').withDefaultValue({}).indexBy('docId').withDefaultValue([])
  const docNameSelector = docSelector.prop('name')

  it("adds a permission", () => {
    const result = permissionSelector.modify(root, { userId: aaron.id, docId: todoTableDoc.id }, list => [...list, Permission.Read])

    const permissions = result.permissions[aaron.id][todoTableDoc.id]

    expect(permissions).to.deep.equal([Permission.Read])
  })

  it("gets permissions", () => {
    const permissions = permissionSelector.get(root, { userId: aaron.id, docId: todoTextDoc.id })

    expect(permissions).to.deep.equal([Permission.Owner])
  })

  it("updates a document", () => {
    const partialUpdate = { name: "done.txt", text: "all finished" }
    const updatedRoot = docSelector.choose(Doc.isText).merge(root, { docId: todoTextDoc.id }, partialUpdate)

    console.log(updatedRoot)
    const updatedDoc = updatedRoot.documents[todoTextDoc.id]

    expect(updatedDoc).to.deep.equal({ ...todoTextDoc, ...partialUpdate })
  })

  it("updates a document and permissions", () => {
    const permission = Permission.Read
    const docId = todoTextDoc.id
    const userId = beatrice.id

    const selector = Biselect.combine<Domain>()
      .add("permissions", permissionSelector)
      .add("docName", docNameSelector.withDefaultValue(""))

    const updatedRoot = selector.modify(root, { userId, docId }, ({permissions, docName}) => ({ permissions: [...permissions, permission], docName: "edited-" + docName }))

    const updatedDocName = updatedRoot.documents[docId].name
    const updatedPermissions = updatedRoot.permissions[userId][docId]

    expect(updatedDocName).to.equal("edited-" + todoTextDoc.name)
    expect(updatedPermissions).to.deep.equal([permission])
  })

  it("uses update chaining to update several parts of the store at once", () => {
    const docId = todoTableDoc.id
    const userId = beatrice.id

    const renameColumn = docSelector.choose(Doc.isTable).deepMerge({ table: { columns: [ "task", "is it done yet" ] } })
    const changeEmail = userSelector.merge({ email: '<redacted>@<redacted>.com' })
    const setDocName = docSelector.prop('name').set("updated.doc")
    const modifyPermission = permissionSelector.modify(permissions => [...permissions, Permission.Read])

    const updated = renameColumn
      .andThen(changeEmail)
      .andThen(setDocName)
      .andThen(modifyPermission)
      (root, { userId, docId })

    const table = updated.documents[docId] as TableDocument
    expect(table.table.columns[1]).to.equal("is it done yet")
    expect(updated.users[userId].email).to.equal("<redacted>@<redacted>.com")
    expect(updated.documents[docId].name).to.equal("updated.doc")
    expect(updated.permissions[userId][docId]).to.deep.equal([Permission.Owner, Permission.Read])
  })
})