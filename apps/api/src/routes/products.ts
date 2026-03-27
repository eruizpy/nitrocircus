import type { FastifyInstance } from 'fastify'
import {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from '../services/product'

interface CreateProductBody {
  name: string
  description: string
  price: number
}

interface UpdateProductBody {
  name?: string
  description?: string
  price?: number
}

const createProductSchema = {
  type: 'object',
  required: ['name', 'description', 'price'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    price: { type: 'number', minimum: 0 },
  },
}

const updateProductSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    price: { type: 'number', minimum: 0 },
  },
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateProductBody }>(
    '/products',
    {
      schema: {
        body: createProductSchema,
      },
    },
    async (req, reply) => {
      try {
        const product = await createProduct(req.body)
        return reply.status(201).send({ ok: true, data: product })
      } catch (error) {
        return reply.status(500).send({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  app.get('/products', async (req, reply) => {
    try {
      const products = await getAllProducts()
      return reply.send({ ok: true, data: products })
    } catch (error) {
      return reply.status(500).send({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  app.get<{ Params: { id: string } }>(
    '/products/:id',
    async (req, reply) => {
      try {
        const product = await getProduct(req.params.id)
        if (!product) {
          return reply.status(404).send({ ok: false, error: 'Product not found' })
        }
        return reply.send({ ok: true, data: product })
      } catch (error) {
        return reply.status(500).send({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  app.put<{ Params: { id: string }; Body: UpdateProductBody }>(
    '/products/:id',
    {
      schema: {
        body: updateProductSchema,
      },
    },
    async (req, reply) => {
      try {
        if (Object.keys(req.body).length === 0) {
          return reply.status(400).send({
            ok: false,
            error: 'At least one field must be provided for update',
          })
        }

        const product = await updateProduct(req.params.id, req.body)
        if (!product) {
          return reply.status(404).send({ ok: false, error: 'Product not found' })
        }
        return reply.send({ ok: true, data: product })
      } catch (error) {
        return reply.status(500).send({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  app.delete<{ Params: { id: string } }>(
    '/products/:id',
    async (req, reply) => {
      try {
        const deleted = await deleteProduct(req.params.id)
        if (!deleted) {
          return reply.status(404).send({ ok: false, error: 'Product not found' })
        }
        return reply.send({ ok: true, message: 'Product deleted successfully' })
      } catch (error) {
        return reply.status(500).send({
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )
}