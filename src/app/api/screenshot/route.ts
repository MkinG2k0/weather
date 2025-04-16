import { BASE_URL } from '@/shared/config/env'

import { NextRequest } from 'next/server'
import puppeteer from 'puppeteer'

export async function GET(req: NextRequest) {
	const {searchParams} = new URL(req.url)
	const url = searchParams.get('url') || BASE_URL
	const width = parseInt(searchParams.get('width') || '800')
	const height = parseInt(searchParams.get('height') || '480')

	let browser: any = null

	try {
		browser = await puppeteer.launch({
			headless: true, // для Puppeteer 20+
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})

		const page = await browser.newPage()
		await page.setViewport({width, height})
		await page.goto(url, {waitUntil: 'networkidle2'})

		const buffer = await page.screenshot({type: 'png'})

		return new Response(buffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store',
			},
		})
	} catch (error) {
		console.error('Ошибка при генерации скрина:', error)
		return new Response(JSON.stringify({error: 'Failed to generate screenshot'}), {
			status: 500,
			headers: {'Content-Type': 'application/json'},
		})
	} finally {
		if (browser) {
			await browser.close()
		}
	}
}
