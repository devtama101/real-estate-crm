// Lead status configuration with colors (matching the CSS design)
export const LEAD_STATUS = {
  NEW: { label: 'Baru', color: 'bg-blue-100 text-blue-700', value: 'NEW' },
  CONTACTED: { label: 'Dihubungi', color: 'bg-purple-100 text-purple-700', value: 'CONTACTED' },
  VIEWING: { label: 'Survei', color: 'bg-amber-100 text-amber-700', value: 'VIEWING' },
  NEGOTIATION: { label: 'Negosiasi', color: 'bg-pink-100 text-pink-700', value: 'NEGOTIATION' },
  CLOSED: { label: 'Closing', color: 'bg-emerald-100 text-emerald-700', value: 'CLOSED' },
  LOST: { label: 'Batal', color: 'bg-slate-100 text-slate-700', value: 'LOST' },
} as const

export const LEAD_SOURCE = {
  WEBSITE: { label: 'Website', value: 'WEBSITE' },
  RUMAH123: { label: 'Rumah123', value: 'RUMAH123' },
  LAMUDI: { label: 'Lamudi', value: 'LAMUDI' },
  OLX: { label: 'OLX Properti', value: 'OLX' },
  REFERRAL: { label: 'Referral', value: 'REFERRAL' },
  OPEN_HOUSE: { label: 'Open House', value: 'OPEN_HOUSE' },
  WALK_IN: { label: 'Walk In', value: 'WALK_IN' },
  SOCIAL_MEDIA: { label: 'Media Sosial', value: 'SOCIAL_MEDIA' },
  WA_BLAST: { label: 'WhatsApp Blast', value: 'WA_BLAST' },
  OTHER: { label: 'Lainnya', value: 'OTHER' },
} as const

export const PROPERTY_STATUS = {
  AVAILABLE: { label: 'Tersedia', color: 'bg-emerald-100 text-emerald-700', value: 'AVAILABLE' },
  RESERVED: { label: 'Booked', color: 'bg-amber-100 text-amber-700', value: 'RESERVED' },
  SOLD: { label: 'Terjual', color: 'bg-red-100 text-red-700', value: 'SOLD' },
  RENTED: { label: 'Disewa', color: 'bg-blue-100 text-blue-700', value: 'RENTED' },
  OFF_MARKET: { label: 'Off Market', color: 'bg-slate-100 text-slate-700', value: 'OFF_MARKET' },
} as const

export const PROPERTY_TYPE = {
  HOUSE: { label: 'Rumah', value: 'HOUSE' },
  CONDO: { label: 'Apartemen', value: 'CONDO' },
  TOWNHOUSE: { label: 'Townhouse', value: 'TOWNHOUSE' },
  APARTMENT: { label: 'Studio', value: 'APARTMENT' },
  LAND: { label: 'Tanah', value: 'LAND' },
  COMMERCIAL: { label: 'Ruko', value: 'COMMERCIAL' },
  VILLA: { label: 'Villa', value: 'VILLA' },
} as const

export const PROPERTY_AMENITIES = [
  { value: 'pool', label: 'Kolam Renang', icon: '🏊' },
  { value: 'garage', label: 'Garasi', icon: '🚗' },
  { value: 'carport', label: 'Carport', icon: '🏎️' },
  { value: 'garden', label: 'Taman', icon: '🌳' },
  { value: 'aircon', label: 'AC', icon: '❄️' },
  { value: 'balcony', label: 'Balkon', icon: '🏠' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'security', label: 'Keamanan 24 Jam', icon: '🔒' },
  { value: 'water', label: 'Air PAM', icon: '💧' },
  { value: 'electricity', label: 'Listrik', icon: '⚡' },
] as const

// Indonesian city list for property search
export const INDONESIAN_CITIES = [
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Jakarta Pusat',
  'Tangerang',
  'Tangerang Selatan',
  'Bekasi',
  'Depok',
  'Bogor',
  'Bandung',
  'Surabaya',
  'Medan',
  'Semarang',
  'Makassar',
  'Denpasar',
  'Yogyakarta',
  'Malang',
] as const

// Indonesian provinces
export const INDONESIAN_PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Banten',
  'DI Yogyakarta',
  'Bali',
  'Sumatera Utara',
  'Sulawesi Selatan',
] as const

// Navigation items matching the HTML prototype
export const NAV_ITEMS = {
  main: [
    { href: '/dashboard', label: 'Dashboard', icon: '▸' },
    { href: '/leads', label: 'Leads', icon: '👥' },
    { href: '/properties', label: 'Properti', icon: '🏘️' },
    { href: '/pipeline', label: 'Pipeline', icon: '📊' },
  ],
  management: [
    { href: '/calendar', label: 'Kalender', icon: '📅' },
    { href: '/commissions', label: 'Komisi', icon: '💰' },
    { href: '/documents', label: 'Dokumen', icon: '📄' },
    { href: '/communication', label: 'Komunikasi', icon: '✉️' },
    { href: '/admin', label: 'Admin', icon: '🔐' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/settings/users', label: 'Settings', icon: '⚙️' },
  ],
} as const

// Currency formatter for Indonesian Rupiah
export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format phone number to Indonesian format
export const formatPhone = (phone: string) => {
  // Convert to Indonesian format: +62 8xx-xxxx-xxxx
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    return '+62 ' + cleaned.substring(1)
  }
  if (cleaned.startsWith('62')) {
    return '+' + cleaned
  }
  return phone
}

// Sample Indonesian property images (Unsplash)
export const SAMPLE_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', // Modern Indonesian house
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // Luxury villa
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Apartment
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // Modern house
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // Property exterior
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // House with pool
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Luxury home
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Modern minimalist
]

// Sample Indonesian names for mock data
export const INDONESIAN_NAMES = [
  'Budi Santoso',
  'Siti Rahayu',
  'Agus Wijaya',
  'Dewi Lestari',
  'Andi Pratama',
  'Rina Wati',
  'Joko Susilo',
  'Maya Sari',
  'Doni Kusuma',
  'Lina Permata',
]

// Indonesian address patterns
export const SAMPLE_ADDRESSES = [
  'Jl. Sudirman No. 123',
  'Jl. Gatot Subroto No. 456',
  'Jl. Thamrin No. 78',
  'Jl. Rasuna Said No. 99',
  'Jl. WR Supratman No. 234',
  'Jl. Ahmad Yani No. 567',
  'Jl. Diponegoro No. 89',
  'Jl. Panglima Sudirman No. 345',
]
