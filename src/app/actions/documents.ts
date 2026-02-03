'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { DocumentType, DocumentStatus } from '@prisma/client'

export async function getDocuments(filters?: {
  leadId?: string
  propertyId?: string
  type?: DocumentType
  status?: DocumentStatus
}) {
  const where: any = {}

  if (filters?.leadId) where.leadId = filters.leadId
  if (filters?.propertyId) where.propertyId = filters.propertyId
  if (filters?.type) where.type = filters.type
  if (filters?.status) where.status = filters.status

  const documents = await prisma.document.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true } },
      property: { select: { id: true, title: true, address: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return documents
}

export async function getDocument(id: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      lead: true,
      property: true,
    },
  })

  return document
}

export async function createDocument(data: {
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  type: DocumentType
  category?: string
  leadId?: string
  propertyId?: string
}) {
  const document = await prisma.document.create({
    data: {
      ...data,
      status: DocumentStatus.DRAFT,
    },
  })

  revalidatePath('/documents')
  return document
}

export async function updateDocument(id: string, data: {
  name?: string
  category?: string
  status?: DocumentStatus
}) {
  const document = await prisma.document.update({
    where: { id },
    data,
  })

  revalidatePath('/documents')
  revalidatePath(`/documents/${id}`)
  return document
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({
    where: { id },
  })

  revalidatePath('/documents')
}

// Mock e-signature functionality
export async function sendForSignature(documentId: string, signerEmail: string, signerName: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!document) throw new Error('Document not found')

  // Update with mock e-signature data
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.SENT,
      esignProvider: 'DocuSign', // Mock
      esignEnvelopeId: `mock-envelope-${Date.now()}`,
      esignStatus: 'PENDING',
    },
  })

  // TODO: Send email via Resend

  revalidatePath('/documents')
  return updated
}

export async function updateSignatureStatus(documentId: string, status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED') {
  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      esignStatus: status,
      ...(status === 'SIGNED' && { status: DocumentStatus.SIGNED }),
    },
  })

  revalidatePath('/documents')
  revalidatePath(`/documents/${documentId}`)
  return document
}
