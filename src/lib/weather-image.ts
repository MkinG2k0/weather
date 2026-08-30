import {WeatherScreen} from '@/components/weather-screen'
import {ImageResponse} from 'next/og'
import {createElement} from 'react'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {quantizePngToPalette} from './quantize-png'
import {getWeatherScreenData, type WeatherScreenData, type WeatherSettings} from './weather'

const fontDir = join(process.cwd(), 'node_modules/@fontsource/ibm-plex-sans/files')

let screenFonts: Promise<{name: string; data: Buffer; weight: 400 | 700; style: 'normal'}[]> | undefined

function loadScreenFonts() {
	screenFonts ??= Promise.all([
		readFile(join(fontDir, 'ibm-plex-sans-cyrillic-400-normal.woff')),
		readFile(join(fontDir, 'ibm-plex-sans-cyrillic-700-normal.woff')),
		readFile(join(fontDir, 'ibm-plex-sans-latin-400-normal.woff')),
		readFile(join(fontDir, 'ibm-plex-sans-latin-700-normal.woff')),
	]).then(([cyr400, cyr700, lat400, lat700]) => [
		{name: 'EinkCyr', data: cyr400, weight: 400 as const, style: 'normal' as const},
		{name: 'EinkCyr', data: cyr700, weight: 700 as const, style: 'normal' as const},
		{name: 'EinkLat', data: lat400, weight: 400 as const, style: 'normal' as const},
		{name: 'EinkLat', data: lat700, weight: 700 as const, style: 'normal' as const},
	])
	return screenFonts
}

export async function renderWeatherImage(settings?: WeatherSettings) {
	const weather = await getWeatherScreenData(settings)
	return renderWeatherDataImage(weather)
}

async function renderOgPng(weather: WeatherScreenData, width: number, height: number) {
	const fonts = await loadScreenFonts()
	let last: unknown
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const image = new ImageResponse(createElement(WeatherScreen, {weather, generatedAtLocal:weather.observedAt}), {width, height, fonts})
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
