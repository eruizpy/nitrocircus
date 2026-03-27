import { ObjectId } from 'mongodb'
import type { Order, Product } from '@nitrocircus/shared'
import { collections, type OrderDoc } from '../db/collections'
import { getProduct } from './product'

function docToOrder(doc: OrderDoc): Order {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId,
    customerEmail: doc.customerEmail,
    products: doc.products,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    status: doc.status,
    paymentId: doc.paymentId,
    shippingAddress: doc.shippingAddress,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function createOrder(data: {
  customerId?: string
  customerEmail: string
  products: Array<{
    productId: string
    quantity: number
  }>
  currency?: string
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}): Promise<Order> {
  // Validate products exist and calculate total
  let totalAmount = 0
  const orderProducts = []

  for (const item of data.products) {
    const product = await getProduct(item.productId)
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`)
    }
    if (item.quantity <= 0) {
      throw new Error('Product quantity must be greater than 0')
    }

    orderProducts.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    })

    totalAmount += product.price * item.quantity
  }

  const now = new Date()
  const doc: Omit<OrderDoc, '_id'> = {
    customerId: data.customerId,
    customerEmail: data.customerEmail,
    products: orderProducts,
    totalAmount,
    currency: data.currency || 'USD',
    status: 'pending',
    shippingAddress: data.shippingAddress,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collections.orders().insertOne(doc as OrderDoc)
  const created = await collections.orders().findOne({ _id: result.insertedId })
  if (!created) throw new Error('Failed to create order')

  return docToOrder(created)
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!ObjectId.isValid(id)) return null

  const doc = await collections.orders().findOne({ _id: new ObjectId(id) })
  return doc ? docToOrder(doc) : null
}

export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  const docs = await collections.orders()
    .find({ customerEmail })
    .sort({ createdAt: -1 })
    .toArray()
  return docs.map(docToOrder)
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  if (!ObjectId.isValid(id)) return null

  const result = await collections.orders().findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  )

  return result ? docToOrder(result) : null
}

export async function updateOrderPayment(orderId: string, paymentId: string): Promise<Order | null> {
  if (!ObjectId.isValid(orderId)) return null

  const result = await collections.orders().findOneAndUpdate(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        paymentId,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  )

  return result ? docToOrder(result) : null
}

export async function getAllOrders(): Promise<Order[]> {
  const docs = await collections.orders().find().sort({ createdAt: -1 }).toArray()
  return docs.map(docToOrder)
}