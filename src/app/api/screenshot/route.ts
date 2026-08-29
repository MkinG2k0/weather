import { NextRequest } from 'next/server'
import puppeteer from 'puppeteer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_URL = 'https://yandex.ru/internet?win=634'
const NAVIGATION_TIMEOUT_MS = 60_000
const RENDER_DELAY_MS = 2_000

function getDimension(value: string | null, fallback: number) {
	const parsed = Number.parseInt(value || '', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(req: NextRequest) {
	const {searchParams} = new URL(req.url)
	const url = searchParams.get('url') || DEFAULT_URL
	const width = getDimension(searchParams.get('width'), 800)
	const height = getDimension(searchParams.get('height'), 480)

	let browser: any = null

	try {
		browser = await puppeteer.launch({
			headless: true, // для Puppeteer 20+
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})

		const page = await browser.newPage()
		page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)
		await page.setViewport({width, height, deviceScaleFactor: 1})

		// Dynamic pages such as Yandex Internetometer keep background requests
		// alive, so networkidle2 may never be reached. DOMContentLoaded is the
		// reliable navigation boundary; the short delay lets client-side UI render.
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: NAVIGATION_TIMEOUT_MS,
		})
		await page.waitForSelector('body', {visible: true, timeout: 10_000})
		await new Promise(resolve => setTimeout(resolve, RENDER_DELAY_MS))

		const buffer = await page.screenshot({type: 'png'})

		return new Response(new Uint8Array(buffer), {
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
