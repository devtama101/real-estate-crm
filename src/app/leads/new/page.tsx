import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import { revalidatePath } from 'next/cache'

async function createLead(formData: FormData) {
  'use server'

  const sourceValue = (formData.get('source') as string) || 'WEBSITE'
  const propertyTypeValue = (formData.get('propertyType') as string) || undefined
  const budgetMinValue = formData.get('budgetMin') as string | null
  const budgetMaxValue = formData.get('budgetMax') as string | null

  const lead = await prisma.lead.create({
    data: {
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || undefined,
      phone: formData.get('phone') as string,
      propertyType: propertyTypeValue,
      budgetMin: (budgetMinValue ? BigInt(budgetMinValue) : undefined) as any,
      budgetMax: (budgetMaxValue ? BigInt(budgetMaxValue) : undefined) as any,
      source: sourceValue as any,
      status: 'NEW',
      notes: (formData.get('notes') as string) || undefined,
      tags: [],
    },
  })

  revalidatePath('/leads')
  revalidatePath('/dashboard')
  redirect(`/leads/${lead.id}`)
}

export default function NewLeadPage() {
  return (
    <div className="app-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Tambah Lead Baru</h1>
            <p>Tambahkan lead baru ke database</p>
          </div>
        </header>

        <div style={{ maxWidth: '600px' }}>
          <form action={createLead} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input 
                name="name" 
                type="text" 
                required 
                className="form-control" 
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  name="email" 
                  type="email" 
                  className="form-control" 
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label>No. HP *</label>
                <input 
                  name="phone" 
                  type="tel" 
                  required 
                  className="form-control" 
                  placeholder="+62..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tipe Properti</label>
              <select name="propertyType" className="form-control">
                <option value="">Pilih tipe properti</option>
                <option value="Rumah">Rumah</option>
                <option value="Apartemen">Apartemen</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Villa">Villa</option>
                <option value="Ruko">Ruko</option>
                <option value="Tanah">Tanah</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Budget Min (Rp)</label>
                <input 
                  name="budgetMin" 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 500000000"
                />
              </div>

              <div className="form-group">
                <label>Budget Max (Rp)</label>
                <input 
                  name="budgetMax" 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 1500000000"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sumber Lead</label>
              <select name="source" className="form-control">
                <option value="">Pilih sumber</option>
                <option value="WEBSITE">Website</option>
                <option value="RUMAH123">Rumah123</option>
                <option value="LAMUDI">Lamudi</option>
                <option value="OLX">OLX Properti</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Media Sosial</option>
                <option value="OPEN_HOUSE">Open House</option>
                <option value="WALK_IN">Walk In</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div className="form-group">
              <label>Catatan</label>
              <textarea 
                name="notes" 
                className="form-control" 
                rows={4}
                placeholder="Catatan tambahan tentang lead ini..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <a href="/leads" className="btn btn-secondary">Batal</a>
              <button type="submit" className="btn btn-primary">Simpan Lead</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
