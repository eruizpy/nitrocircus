import { ObjectId } from 'mongodb'
import type { Payment, PaymentMethod, PaymentStatus } from '@nitrocircus/shared'
import { collections, type PaymentDoc } from '../db/collections'
import { getOrder, updateOrderStatus, updateOrderPayment } from './order'

function docToPayment(doc: PaymentDoc): Payment {
  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    amount: doc.amount,
    currency: doc.currency,
    method: doc.method,
    status: doc.status,
    externalTransactionId: doc.externalTransactionId,
    provider: doc.provider,
    customerEmail: doc.customerEmail,
    billingAddress: doc.billingAddress,
    metadata: doc.metadata,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// Mock payment processing function - in production this would integrate with real payment providers
async function processPaymentWithProvider(payment: {
  amount: number
  currency: string
  method: PaymentMethod
  provider: string
  customerEmail: string
  billingAddress?: Payment['billingAddress']
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock some failure scenarios for demonstration
  if (payment.amount < 0.50) {
    return { success: false, error: 'Amount too small (minimum $0.50)' }
  }

  if (payment.method === 'credit_card' && !payment.billingAddress) {
    return { success: false, error: 'Billing address required for credit card payments' }
  }

  // Simulate 5% failure rate
  if (Math.random() < 0.05) {
    return { success: false, error: 'Payment declined by provider' }
  }

  // Generate mock transaction ID
  const transactionId = `${payment.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return { success: true, transactionId }
}

export async function createPayment(data: {
  orderId: string
  method: PaymentMethod
  provider: string
  customerEmail?: string
  billingAddress?: Payment['billingAddress']
  metadata?: Record<string, unknown>
}): Promise<Payment> {
  // Validate order exists
  const order = await getOrder(data.orderId)
  if (!order) {
    throw new Error(`Order with ID ${data.orderId} not found`)
  }

  if (order.paymentId) {
    throw new Error('Order already has a payment associated')
  }

  // Input validation
  if (!data.provider || data.provider.trim().length === 0) {
    throw new Error('Payment provider is required')
  }

  // Sanitize and validate customer email
  const customerEmail = data.customerEmail || order.customerEmail
  if (!customerEmail || !isValidEmail(customerEmail)) {
    throw new Error('Valid customer email is required')
  }

  const now = new Date()

  // Create pending payment record
  const doc: Omit<PaymentDoc, '_id'> = {
    orderId: data.orderId,
    amount: order.totalAmount,
    currency: order.currency,
    method: data.method,
    status: 'pending',
    provider: data.provider.toLowerCase().trim(),
    customerEmail,
    billingAddress: data.billingAddress,
    metadata: sanitizeMetadata(data.metadata),
    createdAt: now,
    updatedAt: now,
  }

  const result = await collections.payments().insertOne(doc as PaymentDoc)
  const created = await collections.payments().findOne({ _id: result.insertedId })
  if (!created) throw new Error('Failed to create payment')

  const payment = docToPayment(created)

  // Process payment asynchronously
  processPaymentAsync(payment.id)

  return payment
}

async function processPaymentAsync(paymentId: string): Promise<void> {
  try {
    const payment = await getPayment(paymentId)
    if (!payment) return

    // Update status to processing
    await updatePaymentStatus(paymentId, 'processing')

    // Process with payment provider
    const result = await processPaymentWithProvider({
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      customerEmail: payment.customerEmail || '',
      billingAddress: payment.billingAddress,
    })

    if (result.success) {
      // Payment successful
      await updatePaymentStatus(paymentId, 'completed', {
        externalTransactionId: result.transactionId
      })

      // Update order status and link payment
      await updateOrderPayment(payment.orderId, paymentId)
      await updateOrderStatus(payment.orderId, 'confirmed')

    } else {
      // Payment failed
      await updatePaymentStatus(paymentId, 'failed', {
        errorMessage: result.error
      })
    }
  } catch (error) {
    // Handle processing error
    await updatePaymentStatus(paymentId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Payment processing error'
    })
  }
}

export async function getPayment(id: string): Promise<Payment | null> {
  if (!ObjectId.isValid(id)) return null

  const doc = await collections.payments().findOne({ _id: new ObjectId(id) })
  return doc ? docToPayment(doc) : null
}

export async function getPaymentsByOrder(orderId: string): Promise<Payment[]> {
  const docs = await collections.payments()
    .find({ orderId })
    .sort({ createdAt: -1 })
    .toArray()
  return docs.map(docToPayment)
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  updates?: {
    externalTransactionId?: string
    errorMessage?: string
    metadata?: Record<string, unknown>
  }
): Promise<Payment | null> {
  if (!ObjectId.isValid(id)) return null

  const updateDoc: any = {
    status,
    updatedAt: new Date()
  }

  if (updates?.externalTransactionId) {
    updateDoc.externalTransactionId = updates.externalTransactionId
  }

  if (updates?.errorMessage) {
    updateDoc.errorMessage = updates.errorMessage
  }

  if (updates?.metadata) {
    updateDoc.metadata = sanitizeMetadata(updates.metadata)
  }

  const result = await collections.payments().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  )

  return result ? docToPayment(result) : null
}

export async function refundPayment(id: string, reason?: string): Promise<Payment | null> {
  const payment = await getPayment(id)
  if (!payment) return null

  if (payment.status !== 'completed') {
    throw new Error('Can only refund completed payments')
  }

  // In production, this would call the payment provider's refund API
  // For now, just update the status
  return updatePaymentStatus(id, 'refunded', {
    metadata: {
      ...(payment.metadata || {}),
      refundReason: reason || 'Refund requested',
      refundedAt: new Date().toISOString()
    }
  })
}

// Helper functions for security
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined

  const sanitized: Record<string, unknown> = {}

  // Only allow safe metadata keys and values
  const allowedKeys = ['customerNotes', 'internalReference', 'campaignId', 'source']

  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.includes(key) && typeof key === 'string' && key.length <= 100) {
      if (typeof value === 'string' && value.length <= 500) {
        sanitized[key] = value
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

export async function getAllPayments(): Promise<Payment[]> {
  const docs = await collections.payments().find().sort({ createdAt: -1 }).toArray()
  return docs.map(docToPayment)
}