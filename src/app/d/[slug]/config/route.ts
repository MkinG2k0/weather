import {prisma} from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, {params}:{params:Promise<{slug:string}>}) {
	const {slug} = await params
	const panel = await prisma.weatherPanel.findUnique({where:{slug}})
	if (!panel) return Response.json({error:'Device not found'},{status:404})
	const base = new URL(request.url)
	return Response.json({
		version:1,
		deviceId:panel.id,
		refreshIntervalSeconds:panel.refreshMinutes * 60,
		screenUrl:`${base.origin}/d/${panel.slug}/screen.png`,
		updatedAt:panel.updatedAt.toISOString(),
	},{headers:{'Cache-Control':'no-store'}})
}
