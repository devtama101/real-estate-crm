'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { PropertyType, PropertyStatus } from '@prisma/client'
import { googleMaps } from '@/lib/api/google-maps'

const propertySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  propertyType: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  size: z.number().int().min(0),
  lotSize: z.number().int().optional(),
  yearBuilt: z.number().int().optional(),
  price: z.number().int().min(0),
  status: z.nativeEnum(PropertyStatus).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  virtualTourUrl: z.string().optional(),
})

export async function getProperties(filters?: {
  status?: PropertyStatus
  type?: PropertyType
  city?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  const where: any = {}

  if (filters?.status) where.status = filters.status
  if (filters?.type) where.propertyType = filters.type
  if (filters?.city) where.city = { contains: filters.city, mode: 'insensitive' }
  if (filters?.minPrice) where.price = { ...where.price, gte: filters.minPrice }
  if (filters?.maxPrice) where.price = { ...where.price, lte: filters.maxPrice }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const properties = await prisma.property.findMany({
    where,
    include: {
      listedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { listedDate: 'desc' },
  })

  return properties
}

export async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      listedBy: true,
      appointments: true,
      documents: true,
    },
  })

  return property
}

export async function createProperty(formData: FormData) {
  const data = propertySchema.parse(Object.fromEntries(formData))

  // Geocode the address to get lat/lng
  const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`
  const geoResult = await googleMaps.geocode(fullAddress)

  const property = await prisma.property.create({
    data: {
      ...data,
      status: data.status || PropertyStatus.AVAILABLE,
      latitude: geoResult?.latitude,
      longitude: geoResult?.longitude,
      placeId: geoResult?.placeId,
      images: data.images || [],
      amenities: data.amenities || [],
    },
  })

  revalidatePath('/properties')
  revalidatePath('/dashboard')
  redirect('/properties')
}

export async function updateProperty(id: string, formData: FormData) {
  const data = propertySchema.parse(Object.fromEntries(formData))

  // Geocode if address changed
  const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`
  const geoResult = await googleMaps.geocode(fullAddress)

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...data,
      latitude: geoResult?.latitude,
      longitude: geoResult?.longitude,
      placeId: geoResult?.placeId,
    },
  })

  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  return property
}

export async function updatePropertyStatus(id: string, status: PropertyStatus) {
  const property = await prisma.property.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  return property
}

export async function deleteProperty(id: string) {
  await prisma.property.delete({
    where: { id },
  })

  revalidatePath('/properties')
  revalidatePath('/dashboard')
}

export async function getFeaturedProperties(limit = 3) {
  const properties = await prisma.property.findMany({
    where: {
      status: PropertyStatus.AVAILABLE,
    },
    take: limit,
    orderBy: { listedDate: 'desc' },
  })

  return properties
}

export async function searchPropertiesByCriteria(criteria: {
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minSize?: number
  city?: string[]
}) {
  const where: any = { status: PropertyStatus.AVAILABLE }

  if (criteria.propertyType) where.propertyType = criteria.propertyType
  if (criteria.minPrice || criteria.maxPrice) {
    where.price = {}
    if (criteria.minPrice) where.price.gte = criteria.minPrice
    if (criteria.maxPrice) where.price.lte = criteria.maxPrice
  }
  if (criteria.bedrooms) where.bedrooms = { gte: criteria.bedrooms }
  if (criteria.bathrooms) where.bathrooms = { gte: criteria.bathrooms }
  if (criteria.minSize) where.size = { gte: criteria.minSize }
  if (criteria.city && criteria.city.length > 0) {
    where.city = { in: criteria.city }
  }

  const properties = await prisma.property.findMany({
    where,
    take: 10,
    orderBy: { listedDate: 'desc' },
  })

  return properties
}
