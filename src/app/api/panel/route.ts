import {z} from 'zod'
import {getCurrentUser} from '@/lib/auth'
import {BLOCK_IDS} from '@/lib/panel-config'
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
	refreshMinutes: z.number().int().min(5).max(1440),
	layout: z.object({
		blocks: z.array(z.enum(BLOCK_IDS)).min(1).max(3).refine(items=>new Set(items).size===items.length,'Блоки не должны повторяться'),
		showForecast: z.boolean(),
	}),
})

export async function PATCH(request: Request) {
	const user = await getCurrentUser()
	if (!user) return Response.json({error: 'Требуется вход'}, {status: 401})
	try {
		const input = schema.parse(await request.json())
		const panel = await prisma.weatherPanel.findFirst({where: {userId: user.id}})
		if (!panel) return Response.json({error: 'Панель не найдена'}, {status: 404})
		const updated = await prisma.weatherPanel.update({where: {id: panel.id}, data: input})
		return Response.json(serializePanel(updated))
	} catch (error) {
		if (error instanceof z.ZodError) return Response.json({error: 'Проверьте настройки панели'}, {status: 400})
		console.error('Panel update failed:', error)
		return Response.json({error: 'Не удалось сохранить настройки'}, {status: 500})
	}
}
