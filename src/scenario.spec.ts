import { expect } from 'chai';
import 'mocha';
import {Biselect} from './index'
import {indexBy, Lookup} from './util'

type UserId = string
type DocumentId = string

interface Root {
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
  updatedBy: UserId
  table: {
    columns: string[],
    rows: string[][]
  }
}

interface TextDocument {
  id: DocumentId
  type: "text"
  name: string
  updatedBy: UserId
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
  updatedBy: aaron.id,
  text: "- implement unit tests\n- publish to npm\n"
}

const todoTableDoc: TableDocument = {
  id: "doc-12340943",
  type: "table",
  name: "tasks.csv",
  updatedBy: beatrice.id,
  table: {
    columns: ["task", "status"],
    rows: [
      ["implement unit tests", "doing"],
      ["publish to npm", "done"]
    ]
  }
}

const documents = [todoTextDoc, todoTableDoc]

const root: Root = {
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
  const fromRoot = Biselect.from<Root>()
  const userSelector = fromRoot.prop('users').index('userId')
  const docSelector = fromRoot.prop('documents').index('docId')
  const permissionSelector = fromRoot.prop('permissions').index('userId', {}).index('docId', [])
  const docNameSelector = docSelector.prop('name')

  it("adds a permission", () => {
    const result = permissionSelector.modify(root, list => [...list, Permission.Read], { userId: aaron.id, docId: todoTableDoc.id })

    const permissions = result.permissions[aaron.id][todoTableDoc.id]

    expect(permissions).to.deep.equal([Permission.Read])
  })

  it("gets permissions", () => {
    const permissions = permissionSelector.get(root, { userId: aaron.id, docId: todoTextDoc.id })

    expect(permissions).to.deep.equal([Permission.Owner])
  })

  it("updates a document", () => {
    const partialUpdate = { name: "done.txt", text: "all finished" }
    const updatedRoot = docSelector.choose(Doc.isText).merge(root, partialUpdate, { docId: todoTextDoc.id })

    const updatedDoc = updatedRoot.documents[todoTextDoc.id]

    expect(updatedDoc).to.deep.equal({ ...todoTextDoc, ...partialUpdate })
  })

  it("updates a document and permissions", () => {
    const permission = Permission.Read
    const docId = todoTextDoc.id
    const userId = beatrice.id

    const selector = Biselect
      .combine("permissions", permissionSelector)
      .combine("docName", docNameSelector.withDefault(""))

    const updatedRoot = selector.modify(root, ({permissions, docName}) => ({ permissions: [...permissions, permission], docName: "edited-" + docName }), { userId, docId })

    const updatedDocName = updatedRoot.documents[docId].name
    const updatedPermissions = updatedRoot.permissions[userId][docId]

    expect(updatedDocName).to.equal("edited-" + todoTextDoc.name)
    expect(updatedPermissions).to.deep.equal([permission])
  })
})