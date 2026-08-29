import {renderWeatherImage, weatherImageResponse} from '@/lib/weather-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
	try {
		return weatherImageResponse(await renderWeatherImage())
	} catch (error) {
		console.error('Failed to generate weather screen:', error)
		return Response.json({error: 'Failed to generate weather screen'}, {status: 500})
	}
}
