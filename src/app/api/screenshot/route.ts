import {WeatherScreen} from '@/components/weather-screen'
import {writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {ImageResponse} from 'next/og'
import {createElement} from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WIDTH = 800
const HEIGHT = 480
const SCREENSHOT_PATH = process.env.VERCEL
	? path.join(tmpdir(), 'screenshot.png')
	: path.join(process.cwd(), 'public', 'screenshot.png')

export async function GET() {
	try {
		const image = new ImageResponse(createElement(WeatherScreen, {generatedAt: new Date()}), {
			width: WIDTH,
			height: HEIGHT,
			headers: {'Cache-Control': 'no-store'},
		})
		const buffer = Buffer.from(await image.arrayBuffer())
		await writeFile(SCREENSHOT_PATH, buffer)

		return new Response(buffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store',
			},
		})
	} catch (error) {
		console.error('Failed to generate weather screen:', error)
		return Response.json({error: 'Failed to generate weather screen'}, {status: 500})
	}
}
