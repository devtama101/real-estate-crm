/**
 * Google Maps API Client
 * Handles geocoding, place details, and static maps
 *
 * FREE TIER: $200/month credit
 * - Up to 28,000 map loads per month
 * - $7 per 1,000 geocoding requests (after free tier)
 */

export interface GeocodeResult {
  latitude: number
  longitude: number
  placeId: string
  formattedAddress: string
  city?: string
  state?: string
  zipCode?: string
}

export interface PlaceDetails {
  name: string
  address: string
  phone?: string
  website?: string
  rating?: number
}

class GoogleMapsClient {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api'

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
  }

  /**
   * Convert address to coordinates (geocoding)
   * Used when adding a new property
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured')
      return null
    }

    try {
      const url = `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== 'OK' || !data.results?.[0]) {
        console.error('Geocoding failed:', data.status)
        return null
      }

      const result = data.results[0]
      const components = result.address_components

      const getComponent = (types: string[]) =>
        components.find((c: any) => c.types.some((t: string) => types.includes(t)))?.long_name

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        city: getComponent(['locality']),
        state: getComponent(['administrative_area_level_1']),
        zipCode: getComponent(['postal_code']),
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Get static map image URL for property display
   */
  getStaticMapUrl(latitude: number, longitude: number, zoom = 14, width = 600, height = 300): string {
    if (!this.apiKey) return ''

    const center = `${latitude},${longitude}`
    const marker = `color:blue|${latitude},${longitude}`

    return `${this.baseUrl}/staticmap?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${width}x${height}&markers=${encodeURIComponent(marker)}&key=${this.apiKey}`
  }

  /**
   * Get embeddable map URL for iframe
   */
  getEmbedMapUrl(placeId: string): string {
    if (!this.apiKey) return ''

    return `https://www.google.com/maps/embed/v1/place?key=${this.apiKey}&q=place_id:${placeId}`
  }

  /**
   * Calculate distance between two properties (in miles)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Search for nearby amenities
   * Returns schools, malls, transit, etc. near a property
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    type: 'school' | 'shopping_mall' | 'transit_station' | 'restaurant'
  ): Promise<any[] | null> {
    if (!this.apiKey) return null

    try {
      const location = `${latitude},${longitude}`
      const radius = 1609 // 1 mile in meters
      const url = `${this.baseUrl}/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== 'OK') return null

      return data.results || []
    } catch (error) {
      console.error('Nearby search error:', error)
      return null
    }
  }
}

// Singleton instance
export const googleMaps = new GoogleMapsClient()
