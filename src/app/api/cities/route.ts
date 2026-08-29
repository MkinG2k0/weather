import {getCurrentUser} from '@/lib/auth'

type GeocodingResponse = {results?: Array<{id: number; name: string; latitude: number; longitude: number; timezone: string; country?: string; admin1?: string}>}

export async function GET(request: Request) {
	if (!(await getCurrentUser())) return Response.json({error: 'Требуется вход'}, {status: 401})
	const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
	if (query.length < 2) return Response.json({results: []})
	const params = new URLSearchParams({name: query, count: '7', language: 'ru', format: 'json'})
	try {
		const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {signal: AbortSignal.timeout(10_000)})
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = (await response.json()) as GeocodingResponse
		return Response.json({results: (data.results ?? []).map(city => ({
			id: city.id,
			name: [city.name, city.admin1, city.country].filter(Boolean).join(', '),
			latitude: city.latitude,
			longitude: city.longitude,
			timezone: city.timezone,
		}))})
	} catch (error) {
		console.error('City search failed:', error)
		return Response.json({error: 'Не удалось найти город'}, {status: 502})
	}
}
