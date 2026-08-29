import {getWeatherScreenData} from '@/lib/weather'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		return Response.json(await getWeatherScreenData(), {
			headers: {'Cache-Control': 'no-store'},
		})
	} catch (error) {
		console.error('Failed to load weather:', error)
		return Response.json({error: 'Failed to load weather'}, {status: 502})
	}
}
