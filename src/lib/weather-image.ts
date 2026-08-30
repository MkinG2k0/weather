import {WeatherScreen} from '@/components/weather-screen'
import {ImageResponse} from 'next/og'
import {createElement} from 'react'
import {quantizePngToPalette} from './quantize-png'
import {getWeatherScreenData, type WeatherScreenData, type WeatherSettings} from './weather'

export async function renderWeatherImage(settings?: WeatherSettings) {
	const weather = await getWeatherScreenData(settings)
	return renderWeatherDataImage(weather)
}

export async function renderWeatherDataImage(weather: WeatherScreenData) {
	const {width, height, colorMode} = weather.display
	const image = new ImageResponse(createElement(WeatherScreen, {weather, generatedAtLocal:weather.observedAt}), {width, height})
	const buffer = Buffer.from(await image.arrayBuffer())
	try {
		return quantizePngToPalette(buffer, colorMode)
	} catch (error) {
		console.error('Palette quantize failed:', error)
		return buffer
	}
}

export function weatherImageResponse(buffer: Buffer, headers?: HeadersInit) {
	return new Response(buffer, {headers: {
		'Content-Type': 'image/png',
		'Cache-Control': 'no-store',
		...Object.fromEntries(new Headers(headers)),
	}})
}
