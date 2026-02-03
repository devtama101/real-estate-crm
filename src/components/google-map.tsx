'use client'

import { useEffect, useRef, useState } from 'react'

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: bigint
  latitude?: number
  longitude?: number
}

interface GoogleMapProps {
  properties: Property[]
  height?: string
}

export function GoogleMap({ properties, height = '400px' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

    if (!apiKey) {
      setError(false)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    ;(window as any).initMap = () => {
      setLoaded(true)
    }

    script.onerror = () => {
      setError(true)
    }

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      delete (window as any).initMap
    }
  }, [])

  useEffect(() => {
    if (!loaded || !mapRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey) return

    // Default center (Jakarta)
    const center = { lat: -6.2088, lng: 106.8456 }

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })

    const infoWindow = new (window as any).google.maps.InfoWindow()

    // Add markers for properties with coordinates
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: property.latitude, lng: property.longitude },
          map,
          title: property.title,
        })

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px; font-size: 16px;">${property.title}</h3>
              <p style="margin: 0 0 8px; font-size: 13px; color: #666;">${property.address}, ${property.city}</p>
              <p style="margin: 0; font-weight: 600; color: #2c5f8d;">
                ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(property.price))}
              </p>
            </div>
          `)
          infoWindow.open(map, marker)
        })
      }
    })

    // Fit bounds if there are markers
    const bounds = new (window as any).google.maps.LatLngBounds()
    let hasMarkers = false

    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        bounds.extend({ lat: property.latitude, lng: property.longitude })
        hasMarkers = true
      }
    })

    if (hasMarkers) {
      map.fitBounds(bounds)
    }
  }, [loaded, properties])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  if (error) {
    return (
      <div ref={mapRef} style={{ height, background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Failed to load map. Please check your API key.</p>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div ref={mapRef} style={{ height, background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '48px' }}>🗺️</span>
        <p style={{ color: '#6b7280', textAlign: 'center' }}>
          Google Maps akan ditampilkan di sini.<br/>
          Tambahkan NEXT_PUBLIC_GOOGLE_MAPS_KEY di .env
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          Dapatkan API key gratis di: <a href="https://developers.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: '#2c5f8d' }}>Google Cloud Console</a>
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{ height, background: '#f3f4f6', borderRadius: '12px' }}
      aria-label="Google Maps"
    />
  )
}
