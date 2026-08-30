import {z} from 'zod'
import {getCurrentUser} from '@/lib/auth'
import {normalizeDisplay} from '@/lib/display'
import {BLOCK_IDS,MAX_BLOCKS,layoutFits,normalizeCacheScreen,normalizeCardGap,normalizeCornerRadius,normalizeFontSize,normalizeQuietHours,normalizeScreenTheme,normalizeSensor,normalizeShowBorder,normalizeShowFrame,type PanelLayout} from '@/lib/panel-config'
import {serializePanel} from '@/lib/panel-data'
import {prisma} from '@/lib/prisma'

const schema = z.object({
	name: z.string().trim().min(1).max(80),
	cityName: z.string().trim().min(1).max(120),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	timezone: z.string().trim().min(1).max(80),
	language: z.enum(['RU', 'EN']),
	unitSystem: z.enum(['METRIC', 'IMPERIAL']),
	refreshMinutes: z.number().int().min(1).max(1440),
	screenWidth: z.number().int().min(200).max(2048),
	screenHeight: z.number().int().min(200).max(2048),
	colorMode: z.enum(['bw', 'bwr', 'bwy', 'spectra4', 'spectra6', 'rgb']),
	layout: z.object({
		blocks: z.array(z.enum(BLOCK_IDS)).min(1).max(MAX_BLOCKS).refine(items=>new Set(items).size===items.length,'Блоки не должны повторяться'),
		spans: z.record(z.string(),z.number().int().min(1).max(4)).refine(value=>Object.keys(value).every(id=>BLOCK_IDS.includes(id as typeof BLOCK_IDS[number])),'Неизвестная карточка'),
		rowSpans: z.record(z.string(),z.number().int().min(1).max(2)).refine(value=>Object.keys(value).every(id=>BLOCK_IDS.includes(id as typeof BLOCK_IDS[number])),'Неизвестная карточка').optional(),
		photoDataUrl:z.string().max(1_500_000).regex(/^data:image\/(?:png|jpeg|webp);base64,/).optional(),
		fontSize:z.number().int().min(80).max(200).optional(),
		theme:z.enum(['classic','night','poster','air','rail']).optional(),
		cornerRadius:z.number().int().min(0).max(32).optional(),
		cardGap:z.number().int().min(0).max(28).optional(),
		showBorder:z.boolean().optional(),
		showFrame:z.boolean().optional(),
		cacheScreen:z.boolean().optional(),
		quietHours:z.object({
			enabled:z.boolean(),
			startHour:z.number().int().min(0).max(23),
			endHour:z.number().int().min(0).max(23),
			refreshMinutes:z.number().int().min(1).max(1440),
		}).optional(),
		sensor:z.object({pressure:z.boolean(),altitude:z.boolean(),humidity:z.boolean()}).optional(),
		ranges:z.record(z.string(),z.enum(['day','days3','week','weeks2','month'])).optional(),
		sensorChartRange:z.enum(['hour','hours3','hours6','hours12','hours23','hours24','days3','week','month']).optional(),
		sensorChartFilter:z.enum(['raw','spikes','median']).optional(),
		header:z.object({
			visible:z.boolean(),
			showCity:z.boolean(),
			showCoords:z.boolean(),
			showDate:z.boolean(),
			showTime:z.boolean(),
			showBattery:z.boolean(),
			title:z.string().trim().max(48).optional(),
			style:z.enum(['fill','invert','line']),
			size:z.enum(['s','m','l']),
		}).optional(),
	}).refine(value=>layoutFits(value as PanelLayout),'Карточки не помещаются в два ряда'),
})

export async function PATCH(request: Request) {
	const user = await getCurrentUser()
	if (!user) return Response.json({error: 'Требуется вход'}, {status: 401})
	try {
		const input = schema.parse(await request.json())
		const display = normalizeDisplay(input.screenWidth, input.screenHeight, input.colorMode)
		const {screenWidth, screenHeight, colorMode, layout, ...rest} = input
		const panel = await prisma.weatherPanel.findFirst({where: {userId: user.id}})
		if (!panel) return Response.json({error: 'Панель не найдена'}, {status: 404})
		const updated = await prisma.weatherPanel.update({where: {id: panel.id}, data: {
			...rest,
			layout: {...layout, screenWidth: display.width, screenHeight: display.height, colorMode: display.colorMode, fontSize: normalizeFontSize(layout.fontSize), theme: normalizeScreenTheme(layout.theme), cornerRadius: normalizeCornerRadius(layout.cornerRadius), cardGap: normalizeCardGap(layout.cardGap), showBorder: normalizeShowBorder(layout.showBorder), showFrame: normalizeShowFrame(layout.showFrame), cacheScreen: normalizeCacheScreen(layout.cacheScreen), quietHours: normalizeQuietHours(layout.quietHours), sensor: normalizeSensor(layout.sensor), sensorChartRange: layout.sensorChartRange==='hours23'?'hours24':layout.sensorChartRange, sensorChartFilter: layout.sensorChartFilter},
		}})
		return Response.json(serializePanel(updated))
	} catch (error) {
		if (error instanceof z.ZodError) return Response.json({error: 'Проверьте настройки панели'}, {status: 400})
		console.error('Panel update failed:', error)
		return Response.json({error: 'Не удалось сохранить настройки'}, {status: 500})
	}
}
