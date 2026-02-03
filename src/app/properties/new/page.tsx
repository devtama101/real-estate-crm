import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import { revalidatePath } from 'next/cache'

async function createProperty(formData: FormData) {
  'use server'

  const images = formData.get('imageUrl') ? [formData.get('imageUrl') as string] : []

  const property = await prisma.property.create({
    data: {
      title: formData.get('title') as string,
      propertyType: ((formData.get('type') as string) || 'HOUSE') as any,
      price: BigInt(formData.get('price') as string) as any,
      address: formData.get('address') as string,
      city: (formData.get('city') as string) || '',
      state: 'DKI Jakarta',
      zipCode: '12345',
      size: parseInt(formData.get('size') as string) || 0,
      bedrooms: parseInt(formData.get('bedrooms') as string) || 0,
      bathrooms: parseInt(formData.get('bathrooms') as string) || 0,
      description: (formData.get('description') as string) || null,
      images,
      amenities: [],
      status: 'AVAILABLE',
    },
  })

  revalidatePath('/properties')
  revalidatePath('/dashboard')
  redirect(`/properties/${property.id}`)
}

export default function NewPropertyPage() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Tambah Properti Baru</h1>
            <p>Tambahkan listing properti baru</p>
          </div>
        </header>

        <div style={{ maxWidth: '700px' }}>
          <form action={createProperty} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Judul Properti *</label>
              <input 
                name="title" 
                type="text" 
                required 
                className="form-control" 
                placeholder="Contoh: Rumah Modern Minimalis"
              />
            </div>

            <div className="form-group">
              <label>Tipe Properti *</label>
              <select name="type" className="form-control" required>
                <option value="Rumah">Rumah</option>
                <option value="Apartemen">Apartemen</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Villa">Villa</option>
                <option value="Ruko">Ruko</option>
                <option value="Tanah">Tanah</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            <div className="form-group">
              <label>Harga (Rp) *</label>
              <input 
                name="price" 
                type="number" 
                required 
                className="form-control" 
                placeholder="Contoh: 1500000000"
              />
            </div>

            <div className="form-group">
              <label>Alamat *</label>
              <input 
                name="address" 
                type="text" 
                required 
                className="form-control" 
                placeholder="Jl. Contoh No. 123"
              />
            </div>

            <div className="form-group">
              <label>Kota *</label>
              <input 
                name="city" 
                type="text" 
                required 
                className="form-control" 
                placeholder="Contoh: Jakarta Selatan"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <label>Luas (m²)</label>
                <input name="size" type="number" className="form-control" placeholder="150" />
              </div>
              <div className="form-group">
                <label>Kamar Tidur</label>
                <input name="bedrooms" type="number" className="form-control" placeholder="3" />
              </div>
              <div className="form-group">
                <label>Kamar Mandi</label>
                <input name="bathrooms" type="number" className="form-control" placeholder="2" />
              </div>
            </div>

            <div className="form-group">
              <label>URL Foto Utama</label>
              <input 
                name="imageUrl" 
                type="url" 
                className="form-control" 
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>Deskripsi</label>
              <textarea 
                name="description" 
                className="form-control" 
                rows={4}
                placeholder="Deskripsi lengkap properti..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <a href="/properties" className="btn btn-secondary">Batal</a>
              <button type="submit" className="btn btn-primary">Simpan Properti</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
