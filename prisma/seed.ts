import 'dotenv/config'
import { PrismaClient, PropertyType, PropertyStatus, LeadStatus, LeadSource, AppointmentType, AppointmentStatus, DocumentType, DocumentStatus, CommissionStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SAMPLE_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
]

const INDONESIAN_NAMES = [
  'Budi Santoso',
  'Siti Rahayu',
  'Agus Wijaya',
  'Dewi Lestari',
  'Rina Wati',
  'Andi Pratama',
  'Maya Sari',
  'Doni Kusuma',
]

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const agentPassword = await bcrypt.hash('password123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestate-crm.com' },
    update: {},
    create: {
      email: 'admin@realestate-crm.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: adminPassword,
    },
  })

  // Create agent user
  const agent = await prisma.user.upsert({
    where: { email: 'agent@realestate-crm.com' },
    update: {},
    create: {
      email: 'agent@realestate-crm.com',
      name: 'Andi Pratama',
      role: 'AGENT',
      password: agentPassword,
    },
  })

  console.log('✅ Users created')

  // Create properties
  const properties = await Promise.all([
    prisma.property.upsert({
      where: { mlsId: 'PROP-001' },
      update: {},
      create: {
        mlsId: 'PROP-001',
        title: 'Rumah Modern Minimalis',
        description: 'Rumah modern dengan desain minimalis, lokasi strategis di Jakarta Selatan',
        address: 'Jl. Sudirman No. 123',
        city: 'Jakarta Selatan',
        state: 'DKI Jakarta',
        zipCode: '12190',
        country: 'Indonesia',
        propertyType: PropertyType.HOUSE,
        bedrooms: 4,
        bathrooms: 3,
        size: 250,
        lotSize: 150,
        yearBuilt: 2020,
        price: 2500000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.2250,
        longitude: 106.8000,
        amenities: ['Kolam Renang', 'Garasi', 'Taman', 'AC'],
        images: [SAMPLE_PROPERTY_IMAGES[0]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-002' },
      update: {},
      create: {
        mlsId: 'PROP-002',
        title: 'Apartemen Mewah di Pusat Kota',
        description: 'Apartemen mewah dengan fasilitas lengkap di pusat kota Jakarta',
        address: 'Jl. Gatot Subroto Kav 52',
        city: 'Jakarta Pusat',
        state: 'DKI Jakarta',
        zipCode: '10250',
        country: 'Indonesia',
        propertyType: PropertyType.APARTMENT,
        bedrooms: 2,
        bathrooms: 2,
        size: 85,
        price: 1500000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.2000,
        longitude: 106.8200,
        amenities: ['Gym', 'Keamanan 24 Jam', 'AC', 'Kolam Renang'],
        images: [SAMPLE_PROPERTY_IMAGES[1]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-003' },
      update: {},
      create: {
        mlsId: 'PROP-003',
        title: 'Villa Mewah Dengan Kolam Renang',
        description: 'Villa mewah dengan pemandangan kota Bandung',
        address: 'Jl. Dago Atas No. 45',
        city: 'Bandung',
        state: 'Jawa Barat',
        zipCode: '40135',
        country: 'Indonesia',
        propertyType: PropertyType.VILLA,
        bedrooms: 5,
        bathrooms: 4,
        size: 420,
        lotSize: 300,
        price: 4500000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.8987,
        longitude: 107.6098,
        amenities: ['Kolam Renang', 'Taman', 'Garasi', 'Balkon'],
        images: [SAMPLE_PROPERTY_IMAGES[2]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-004' },
      update: {},
      create: {
        mlsId: 'PROP-004',
        title: 'Townhouse Modern Cluster',
        description: 'Townhouse modern di cluster BSD City',
        address: 'Jl. BSD City No. 88',
        city: 'Tangerang Selatan',
        state: 'Banten',
        zipCode: '15310',
        country: 'Indonesia',
        propertyType: PropertyType.TOWNHOUSE,
        bedrooms: 3,
        bathrooms: 2,
        size: 180,
        price: 1850000000,
        status: PropertyStatus.RESERVED,
        latitude: -6.3000,
        longitude: 106.6500,
        amenities: ['Carport', 'Taman'],
        images: [SAMPLE_PROPERTY_IMAGES[3]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-005' },
      update: {},
      create: {
        mlsId: 'PROP-005',
        title: 'Rumah Tropis di Bali',
        description: 'Rumah tropis dengan akses dekat ke pantai',
        address: 'Jl. Pantai Berawa No. 12',
        city: 'Kuta Utara',
        state: 'Bali',
        zipCode: '80361',
        country: 'Indonesia',
        propertyType: PropertyType.HOUSE,
        bedrooms: 4,
        bathrooms: 3,
        size: 280,
        lotSize: 200,
        price: 5200000000,
        status: PropertyStatus.SOLD,
        latitude: -8.7152,
        longitude: 115.1354,
        amenities: ['Kolam Renang', 'Taman', 'Garasi'],
        images: [SAMPLE_PROPERTY_IMAGES[4]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-006' },
      update: {},
      create: {
        mlsId: 'PROP-006',
        title: 'Studio Apartment untuk Investasi',
        description: 'Studio apartment strategis untuk investasi',
        address: 'Jl. Asia Afrika No. 8',
        city: 'Bandung',
        state: 'Jawa Barat',
        zipCode: '40261',
        country: 'Indonesia',
        propertyType: PropertyType.STUDIO,
        bedrooms: 1,
        bathrooms: 1,
        size: 36,
        price: 650000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.9215,
        longitude: 107.6108,
        amenities: ['AC'],
        images: [SAMPLE_PROPERTY_IMAGES[5]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-007' },
      update: {},
      create: {
        mlsId: 'PROP-007',
        title: 'Ruko Strategis 3 Lantai',
        description: 'Ruko 3 lantai di lokasi strategis Jakarta Pusat',
        address: 'Jl. MH Thamrin No. 56',
        city: 'Jakarta Pusat',
        state: 'DKI Jakarta',
        zipCode: '10350',
        country: 'Indonesia',
        propertyType: PropertyType.COMMERCIAL,
        bedrooms: 0,
        bathrooms: 3,
        size: 200,
        price: 3500000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.1937,
        longitude: 106.8230,
        amenities: ['Garasi', 'Keamanan 24 Jam'],
        images: [SAMPLE_PROPERTY_IMAGES[6]],
        listedById: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { mlsId: 'PROP-008' },
      update: {},
      create: {
        mlsId: 'PROP-008',
        title: 'Rumah Cluster Nuansa Asri',
        description: 'Rumah di cluster dengan nuansa asri dan tenang',
        address: 'Jl. Graha Raya No. 234',
        city: 'Tangerang',
        state: 'Banten',
        zipCode: '15325',
        country: 'Indonesia',
        propertyType: PropertyType.HOUSE,
        bedrooms: 3,
        bathrooms: 2,
        size: 150,
        price: 1200000000,
        status: PropertyStatus.AVAILABLE,
        latitude: -6.2500,
        longitude: 106.7000,
        amenities: ['Carport', 'Taman', 'Air PAM'],
        images: [SAMPLE_PROPERTY_IMAGES[7]],
        listedById: agent.id,
      },
    }),
  ])

  console.log(`✅ Created ${properties.length} properties`)

  // Create leads
  const leads = await Promise.all([
    prisma.lead.upsert({
      where: { id: 'lead-001' },
      update: {},
      create: {
        id: 'lead-001',
        name: 'Budi Santoso',
        email: 'budi.santoso@email.com',
        phone: '+62 812-3456-7890',
        budgetMin: 2000000000,
        budgetMax: 3000000000,
        budgetDisplay: 'Rp 2 - 3 Miliar',
        propertyType: 'Rumah',
        bedrooms: 3,
        bathrooms: 2,
        minSize: 150,
        preferredAreas: ['Jakarta Selatan', 'Tangerang Selatan'],
        notes: 'Mencari rumah untuk keluarga, dekat dengan sekolah internasional',
        tags: ['hot-lead', 'serius'],
        source: LeadSource.WEBSITE,
        status: LeadStatus.VIEWING,
        assignedToId: agent.id,
        propertyInterest: properties[0].id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-002' },
      update: {},
      create: {
        id: 'lead-002',
        name: 'Siti Rahayu',
        email: 'siti.raahayu@email.com',
        phone: '+62 813-4567-8901',
        budgetMin: 1000000000,
        budgetMax: 1700000000,
        budgetDisplay: 'Rp 1 - 1,7 Miliar',
        propertyType: 'Apartemen',
        bedrooms: 2,
        bathrooms: 1,
        minSize: 60,
        preferredAreas: ['Jakarta Pusat', 'Jakarta Selatan'],
        notes: 'Pertama kali beli apartemen untuk investasi',
        tags: ['investor'],
        source: LeadSource.RUMAH123,
        status: LeadStatus.CONTACTED,
        assignedToId: agent.id,
        propertyInterest: properties[1].id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-003' },
      update: {},
      create: {
        id: 'lead-003',
        name: 'Agus Wijaya',
        email: 'agus.wijaya@email.com',
        phone: '+62 814-5678-9012',
        budgetMin: 4000000000,
        budgetMax: 5000000000,
        budgetDisplay: 'Rp 4 - 5 Miliar',
        propertyType: 'Villa',
        bedrooms: 4,
        bathrooms: 3,
        minSize: 300,
        preferredAreas: ['Bandung', 'Bogor'],
        notes: 'Mencari villa untuk liburan keluarga',
        tags: ['hot-lead'],
        source: LeadSource.LAMUDI,
        status: LeadStatus.NEGOTIATION,
        assignedToId: agent.id,
        propertyInterest: properties[2].id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-004' },
      update: {},
      create: {
        id: 'lead-004',
        name: 'Dewi Lestari',
        email: 'dewi.lestari@email.com',
        phone: '+62 815-6789-0123',
        budgetMin: 500000000,
        budgetMax: 800000000,
        budgetDisplay: 'Rp 500 - 800 Juta',
        propertyType: 'Studio',
        bedrooms: 1,
        bathrooms: 1,
        minSize: 30,
        preferredAreas: ['Bandung', 'Jakarta Selatan'],
        notes: 'Investasi studio apartment untuk disewakan',
        tags: ['investor', 'first-time-buyer'],
        source: LeadSource.REFERRAL,
        status: LeadStatus.NEW,
        assignedToId: agent.id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-005' },
      update: {},
      create: {
        id: 'lead-005',
        name: 'Rina Wati',
        email: 'rina.wati@email.com',
        phone: '+62 816-7890-1234',
        budgetMin: 1500000000,
        budgetMax: 2000000000,
        budgetDisplay: 'Rp 1,5 - 2 Miliar',
        propertyType: 'Townhouse',
        bedrooms: 3,
        bathrooms: 2,
        minSize: 120,
        preferredAreas: ['Tangerang Selatan', 'BSD City'],
        notes: 'Mencari townhouse untuk tinggal dengan keluarga kecil',
        tags: ['serius'],
        source: LeadSource.SOCIAL_MEDIA,
        status: LeadStatus.CONTACTED,
        assignedToId: agent.id,
        propertyInterest: properties[3].id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-006' },
      update: {},
      create: {
        id: 'lead-006',
        name: 'Maya Sari',
        email: 'maya.sari@email.com',
        phone: '+62 817-8901-2345',
        budgetMin: 5000000000,
        budgetMax: 6000000000,
        budgetDisplay: 'Rp 5 - 6 Miliar',
        propertyType: 'Rumah',
        bedrooms: 5,
        bathrooms: 4,
        minSize: 300,
        preferredAreas: ['Bali'],
        notes: 'Mencari rumah liburan di Bali dekat pantai',
        tags: ['hot-lead', 'VIP'],
        source: LeadSource.OLX,
        status: LeadStatus.CLOSED,
        assignedToId: agent.id,
        propertyInterest: properties[4].id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-007' },
      update: {},
      create: {
        id: 'lead-007',
        name: 'Doni Kusuma',
        email: 'doni.kusuma@email.com',
        phone: '+62 818-9012-3456',
        budgetMin: 2000000000,
        budgetMax: 4000000000,
        budgetDisplay: 'Rp 2 - 4 Miliar',
        propertyType: 'Ruko',
        bedrooms: 0,
        bathrooms: 2,
        minSize: 150,
        preferredAreas: ['Jakarta Pusat', 'Jakarta Barat'],
        notes: 'Mencari ruko untuk usaha',
        tags: ['investor', 'usaha'],
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        assignedToId: agent.id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'lead-008' },
      update: {},
      create: {
        id: 'lead-008',
        name: 'Andi Pratama Jr.',
        email: 'andi.jr@email.com',
        phone: '+62 819-0123-4567',
        budgetMin: 1000000000,
        budgetMax: 1500000000,
        budgetDisplay: 'Rp 1 - 1,5 Miliar',
        propertyType: 'Rumah',
        bedrooms: 2,
        bathrooms: 1,
        minSize: 80,
        preferredAreas: ['Tangerang', 'Tangerang Selatan'],
        notes: 'Pertama kali beli rumah untuk keluarga muda',
        tags: ['first-time-buyer', 'milenial'],
        source: LeadSource.REFERRAL,
        status: LeadStatus.VIEWING,
        assignedToId: agent.id,
      },
    }),
  ])

  console.log(`✅ Created ${leads.length} leads`)

  // Create appointments
  const now = new Date()
  const appointments = await Promise.all([
    prisma.appointment.upsert({
      where: { id: 'apt-001' },
      update: {},
      create: {
        id: 'apt-001',
        title: 'Survei Properti Rumah Modern Minimalis',
        description: 'Survei properti dengan Budi Santoso',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        type: AppointmentType.VIEWING,
        status: AppointmentStatus.SCHEDULED,
        leadId: leads[0].id,
        propertyId: properties[0].id,
        createdById: agent.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-002' },
      update: {},
      create: {
        id: 'apt-002',
        title: 'Konsultasi Investasi Apartemen',
        description: 'Konsultasi dengan Siti Rahayu mengenai investasi apartemen',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        type: AppointmentType.CONSULTATION,
        status: AppointmentStatus.SCHEDULED,
        leadId: leads[1].id,
        propertyId: properties[1].id,
        createdById: agent.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-003' },
      update: {},
      create: {
        id: 'apt-003',
        title: 'Survei Villa di Dago Atas',
        description: 'Survei villa dengan Agus Wijaya',
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 23 * 60 * 60 * 1000),
        type: AppointmentType.VIEWING,
        status: AppointmentStatus.COMPLETED,
        leadId: leads[2].id,
        propertyId: properties[2].id,
        createdById: agent.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-004' },
      update: {},
      create: {
        id: 'apt-004',
        title: 'Tanda Tangan Kontrak',
        description: 'Tanda tangan kontrak jual beli dengan Maya Sari',
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        type: AppointmentType.CONTRACT_SIGNING,
        status: AppointmentStatus.SCHEDULED,
        leadId: leads[5].id,
        propertyId: properties[4].id,
        createdById: agent.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-005' },
      update: {},
      create: {
        id: 'apt-005',
        title: 'Follow Up - Doni Kusuma',
        description: 'Follow up mengenai ruko yang diminati',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        type: AppointmentType.FOLLOW_UP,
        status: AppointmentStatus.SCHEDULED,
        leadId: leads[6].id,
        createdById: agent.id,
      },
    }),
  ])

  console.log(`✅ Created ${appointments.length} appointments`)

  // Create documents
  await Promise.all([
    prisma.document.upsert({
      where: { id: 'doc-001' },
      update: {},
      create: {
        id: 'doc-001',
        name: 'Perjanjian Jual Beli - Budi Santoso',
        fileName: 'pjb_santoso.pdf',
        fileSize: 245760,
        mimeType: 'application/pdf',
        url: '/documents/pjb_santoso.pdf',
        type: DocumentType.CONTRACT,
        category: 'Jual Beli',
        status: DocumentStatus.SIGNED,
        esignProvider: 'DocuSign',
        esignEnvelopeId: 'env-001',
        esignStatus: 'SIGNED',
        leadId: leads[0].id,
        propertyId: properties[0].id,
      },
    }),
    prisma.document.upsert({
      where: { id: 'doc-002' },
      update: {},
      create: {
        id: 'doc-002',
        name: 'Perjanjian Listing - Siti Rahayu',
        fileName: 'listing_rahayu.pdf',
        fileSize: 156789,
        mimeType: 'application/pdf',
        url: '/documents/listing_rahayu.pdf',
        type: DocumentType.CONTRACT,
        category: 'Listing',
        status: DocumentStatus.SENT,
        esignProvider: 'DocuSign',
        esignEnvelopeId: 'env-002',
        esignStatus: 'PENDING',
        leadId: leads[1].id,
      },
    }),
    prisma.document.upsert({
      where: { id: 'doc-003' },
      update: {},
      create: {
        id: 'doc-003',
        name: 'Surat Penawaran - Agus Wijaya',
        fileName: 'penawaran_wijaya.pdf',
        fileSize: 98432,
        mimeType: 'application/pdf',
        url: '/documents/penawaran_wijaya.pdf',
        type: DocumentType.OFFER_LETTER,
        category: 'Penawaran',
        status: DocumentStatus.DRAFT,
        leadId: leads[2].id,
        propertyId: properties[2].id,
      },
    }),
    prisma.document.upsert({
      where: { id: 'doc-004' },
      update: {},
      create: {
        id: 'doc-004',
        name: 'Laporan Inspeksi - Villa Dago',
        fileName: 'inspeksi_dago.pdf',
        fileSize: 187654,
        mimeType: 'application/pdf',
        url: '/documents/inspeksi_dago.pdf',
        type: DocumentType.INSPECTION_REPORT,
        category: 'Inspeksi',
        status: DocumentStatus.SIGNED,
        propertyId: properties[2].id,
      },
    }),
  ])

  console.log(`✅ Created documents`)

  // Create commissions
  await Promise.all([
    prisma.commission.upsert({
      where: { id: 'comm-001' },
      update: {},
      create: {
        id: 'comm-001',
        dealValue: 5200000000,
        commissionRate: 0.03,
        commissionAmount: 156000000,
        status: CommissionStatus.PAID,
        paidDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        paidAmount: 156000000,
        closedDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        propertyId: properties[4].id,
        agentId: agent.id,
      },
    }),
    prisma.commission.upsert({
      where: { id: 'comm-002' },
      update: {},
      create: {
        id: 'comm-002',
        dealValue: 4500000000,
        commissionRate: 0.025,
        commissionAmount: 112500000,
        splitPercentage: 50,
        splitAmount: 56250000,
        status: CommissionStatus.PENDING,
        closedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        propertyId: properties[2].id,
        agentId: agent.id,
      },
    }),
    prisma.commission.upsert({
      where: { id: 'comm-003' },
      update: {},
      create: {
        id: 'comm-003',
        dealValue: 1850000000,
        commissionRate: 0.03,
        commissionAmount: 55500000,
        status: CommissionStatus.APPROVED,
        closedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        propertyId: properties[3].id,
        agentId: agent.id,
      },
    }),
  ])

  console.log(`✅ Created commissions`)

  // Create activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'CALL',
        description: 'Telepon dengan Budi Santoso - menjadwalkan survei',
        leadId: leads[0].id,
        createdById: agent.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'EMAIL_SENT',
        description: 'Kirim brosur properti ke Siti Rahayu',
        leadId: leads[1].id,
        createdById: agent.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'VIEWING_SCHEDULED',
        description: 'Survei villa di Dago Atas dengan Agus Wijaya',
        leadId: leads[2].id,
        createdById: agent.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        description: 'Lead status berubah dari NEW ke CONTACTED',
        leadId: leads[1].id,
        createdById: agent.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'NOTE',
        description: 'Doni sedang mencari ruko untuk buka usaha kedai kopi',
        leadId: leads[6].id,
        createdById: agent.id,
      },
    }),
  ])

  console.log(`✅ Created activities`)

  // Create email templates
  await Promise.all([
    prisma.emailTemplate.upsert({
      where: { name: 'Follow Up Lead Baru' },
      update: {},
      create: {
        name: 'Follow Up Lead Baru',
        subject: 'Terima kasih atas ketertarikan Anda!',
        body: 'Halo {{firstName}},\n\nTerima kasih telah mengunjungi website kami. Saya {{agentName}} akan senang membantu Anda menemukan properti impian.\n\nSalam,\n{{agentName}}\n{{company}}',
        category: 'FOLLOW_UP',
        variables: ['firstName', 'agentName', 'company'],
        isActive: true,
      },
    }),
    prisma.emailTemplate.upsert({
      where: { name: 'Alert Properti Baru' },
      update: {},
      create: {
        name: 'Alert Properti Baru',
        subject: 'Properti baru yang cocok dengan kriteria Anda!',
        body: 'Halo {{firstName}},\n\nKami punya properti baru yang mungkin cocok dengan kriteria pencarian Anda:\n\n{{propertyTitle}}\n{{propertyAddress}}\nHarga: {{propertyPrice}}\n\nUntuk info lebih lanjut, hubungi kami.\n\nSalam,\n{{agentName}}',
        category: 'PROPERTY_ALERT',
        variables: ['firstName', 'agentName', 'propertyTitle', 'propertyAddress', 'propertyPrice'],
        isActive: true,
      },
    }),
    prisma.emailTemplate.upsert({
      where: { name: 'Konfirmasi Survei' },
      update: {},
      create: {
        name: 'Konfirmasi Survei',
        subject: 'Survei Properti Dikonfirmasi',
        body: 'Halo {{firstName}},\n\nSurvei properti Anda telah dikonfirmasi:\n\nProperti: {{propertyTitle}}\nAlamat: {{propertyAddress}}\nTanggal: {{viewingDate}}\nJam: {{viewingTime}}\n\nMohon hadir 10 menit sebelum jadwal.\n\nSalam,\n{{agentName}}',
        category: 'VIEWING_CONFIRMATION',
        variables: ['firstName', 'agentName', 'propertyTitle', 'propertyAddress', 'viewingDate', 'viewingTime'],
        isActive: true,
      },
    }),
    prisma.emailTemplate.upsert({
      where: { name: 'Pengingat Survei' },
      update: {},
      create: {
        name: 'Pengingat Survei',
        subject: 'Pengingat: Survei Properti Besok',
        body: 'Halo {{firstName}},\n\nIni adalah pengingat untuk survei properti Anda besok:\n\nProperti: {{propertyTitle}}\nAlamat: {{propertyAddress}}\nJam: {{viewingTime}}\n\nSampai jumpa besok!\n\nSalam,\n{{agentName}}',
        category: 'VIEWING_REMINDER',
        variables: ['firstName', 'agentName', 'propertyTitle', 'propertyAddress', 'viewingTime'],
        isActive: true,
      },
    }),
    prisma.emailTemplate.upsert({
      where: { name: 'Selamat Offer Diterima' },
      update: {},
      create: {
        name: 'Selamat Offer Diterima',
        subject: 'Selamat! Offer Anda diterima!',
        body: 'Halo {{firstName}},\n\nSelamat! Offer sebesar {{offerAmount}} untuk properti {{propertyTitle}} telah diterima oleh pemilik.\n\nLangkah selanjutnya kami akan menghubungi Anda untuk proses lebih lanjut.\n\nSalam,\n{{agentName}}',
        category: 'THANK_YOU',
        variables: ['firstName', 'agentName', 'offerAmount', 'propertyTitle'],
        isActive: true,
      },
    }),
    prisma.emailTemplate.upsert({
      where: { name: 'Re-engagement' },
      update: {},
      create: {
        name: 'Re-engagement',
        subject: 'Masih mencari properti impian?',
        body: 'Halo {{firstName}},\n\nSaya {{agentName}} ingin menghubungi Anda kembali. Apakah Anda masih mencari properti?\n\nBila ya, kami punya beberapa listing baru yang mungkin cocok untuk Anda.\n\nHubungi saya di {{agentPhone}} untuk informasi lebih lanjut.\n\nSalam,\n{{agentName}}',
        category: 'REENGAGEMENT',
        variables: ['firstName', 'agentName', 'agentPhone'],
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created email templates`)

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
