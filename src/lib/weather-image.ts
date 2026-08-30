import {WeatherScreen} from '@/components/weather-screen'
import {ImageResponse} from 'next/og'
import {createElement} from 'react'
import {quantizePngToPalette} from './quantize-png'
import {getWeatherScreenData, type WeatherScreenData, type WeatherSettings} from './weather'

export async function renderWeatherImage(settings?: WeatherSettings) {
	const weather = await getWeatherScreenData(settings)
	return renderWeatherDataImage(weather)
}

async function renderOgPng(weather: WeatherScreenData, width: number, height: number) {
	let last: unknown
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const image = new ImageResponse(createElement(WeatherScreen, {weather, generatedAtLocal:weather.observedAt}), {width, height})
			return Buffer.from(await image.arrayBuffer())
		} catch (error) {
			last = error
			console.error('OG weather image failed:', error)
		}
	}
	throw last instanceof Error ? last : new Error('Failed to render weather PNG')
}

export async function renderWeatherDataImage(weather: WeatherScreenData) {
	const {width, height, colorMode} = weather.display
	const buffer = await renderOgPng(weather, width, height)
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
