import {randomBytes} from 'node:crypto'
import {getCurrentUser} from '@/lib/auth'
import {serializePanel} from '@/lib/panel-data'
import {prisma} from '@/lib/prisma'

export async function POST() {
	const user = await getCurrentUser()
	if (!user) return Response.json({error: 'Требуется вход'}, {status: 401})
	const panel = await prisma.weatherPanel.findFirst({where: {userId: user.id}})
	if (!panel) return Response.json({error: 'Панель не найдена'}, {status: 404})
	const updated = await prisma.weatherPanel.update({where: {id: panel.id}, data: {slug: randomBytes(18).toString('base64url')}})
	return Response.json(serializePanel(updated))
}
