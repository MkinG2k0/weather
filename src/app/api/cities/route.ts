import {getCurrentUser} from '@/lib/auth'

type GeocodingResponse = {results?: Array<{id: number; name: string; latitude: number; longitude: number; timezone: string; country?: string; admin1?: string}>}
type ReverseResponse = {address?:{city?:string;town?:string;village?:string;municipality?:string;county?:string;state?:string;country?:string}}
type TimezoneResponse = {timezone?:string}

export async function GET(request: Request) {
	if (!(await getCurrentUser())) return Response.json({error: 'Требуется вход'}, {status: 401})
	const searchParams = new URL(request.url).searchParams
	const latitudeValue=searchParams.get('lat');const longitudeValue=searchParams.get('lon')
	const latitude = latitudeValue===null?Number.NaN:Number(latitudeValue)
	const longitude = longitudeValue===null?Number.NaN:Number(longitudeValue)
	if (searchParams.has('lat') || searchParams.has('lon')) {
		if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return Response.json({error:'Некорректные координаты'}, {status:400})
		const lat=latitude.toFixed(5);const lon=longitude.toFixed(5)
		try {
			const [placeResponse,timezoneResponse]=await Promise.all([
				fetch(`https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({lat,lon,format:'jsonv2',addressdetails:'1','accept-language':'ru'})}`, {headers:{'User-Agent':'EInkWeather/1.0 (https://weather-e-ink.vercel.app)'},signal:AbortSignal.timeout(10_000),next:{revalidate:86_400}}),
				fetch(`https://api.open-meteo.com/v1/forecast?${new URLSearchParams({latitude:lat,longitude:lon,current:'temperature_2m',timezone:'auto',forecast_days:'1'})}`, {signal:AbortSignal.timeout(10_000),next:{revalidate:86_400}}),
			])
			if (!placeResponse.ok || !timezoneResponse.ok) throw new Error(`HTTP ${placeResponse.status}/${timezoneResponse.status}`)
			const place=(await placeResponse.json()) as ReverseResponse;const timezone=(await timezoneResponse.json()) as TimezoneResponse
			const address=place.address??{};const name=address.city??address.town??address.village??address.municipality??address.county??'Моё местоположение'
			return Response.json({result:{id:`gps-${lat}-${lon}`,name,label:[name,address.state,address.country].filter(Boolean).join(', '),region:address.state??'',country:address.country??'',latitude,longitude,timezone:timezone.timezone??'auto'}})
		} catch (error) {
			console.error('Reverse geocoding failed:', error)
			return Response.json({error:'Не удалось определить город по координатам'}, {status:502})
		}
	}

	const query = searchParams.get('q')?.trim() ?? ''
	if (query.length < 2) return Response.json({results: []})
	const params = new URLSearchParams({name: query, count: '7', language: 'ru', format: 'json'})
	try {
		const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {signal: AbortSignal.timeout(10_000)})
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = (await response.json()) as GeocodingResponse
		return Response.json({results: (data.results ?? []).map(city => ({
			id: city.id,
			name: city.name,
			label: [city.name, city.admin1, city.country].filter(Boolean).join(', '),
			region: city.admin1 ?? '',
			country: city.country ?? '',
			latitude: city.latitude,
			longitude: city.longitude,
			timezone: city.timezone,
		}))})
	} catch (error) {
		console.error('City search failed:', error)
		return Response.json({error: 'Не удалось найти город'}, {status: 502})
	}
}
