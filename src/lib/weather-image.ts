import {WeatherScreen} from '@/components/weather-screen'
import {ImageResponse} from 'next/og'
import {createElement} from 'react'
import {getWeatherScreenData, type WeatherSettings} from './weather'

export async function renderWeatherImage(settings?: WeatherSettings) {
	const weather = await getWeatherScreenData(settings)
	const image = new ImageResponse(createElement(WeatherScreen, {weather, generatedAt: new Date()}), {width: 800, height: 480})
	return Buffer.from(await image.arrayBuffer())
}

export function weatherImageResponse(buffer: Buffer) {
	return new Response(buffer, {headers: {
		'Content-Type': 'image/png',
		'Cache-Control': 'no-store',
	}})
}
