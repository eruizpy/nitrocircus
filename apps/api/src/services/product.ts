import { ObjectId } from 'mongodb'
import type { Product } from '@nitrocircus/shared'
import { collections, type ProductDoc } from '../db/collections'

function docToProduct(doc: ProductDoc): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function createProduct(data: {
  name: string
  description: string
  price: number
}): Promise<Product> {
  const now = new Date()
  const doc: Omit<ProductDoc, '_id'> = {
    name: data.name,
    description: data.description,
    price: data.price,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collections.products().insertOne(doc as ProductDoc)
  const created = await collections.products().findOne({ _id: result.insertedId })
  if (!created) throw new Error('Failed to create product')

  return docToProduct(created)
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!ObjectId.isValid(id)) return null

  const doc = await collections.products().findOne({ _id: new ObjectId(id) })
  return doc ? docToProduct(doc) : null
}

export async function getAllProducts(): Promise<Product[]> {
  const docs = await collections.products().find().sort({ createdAt: -1 }).toArray()
  return docs.map(docToProduct)
}

export async function updateProduct(id: string, data: {
  name?: string
  description?: string
  price?: number
}): Promise<Product | null> {
  if (!ObjectId.isValid(id)) return null

  const updateDoc = {
    ...data,
    updatedAt: new Date(),
  }

  const result = await collections.products().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  )

  return result ? docToProduct(result) : null
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false

  const result = await collections.products().deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}