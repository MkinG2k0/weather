import {prisma} from '@/lib/prisma'
import {COLOR_MODES, normalizeDisplay} from '@/lib/display'
import {normalizeLayout} from '@/lib/panel-config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, {params}:{params:Promise<{slug:string}>}) {
	const {slug} = await params
	const panel = await prisma.weatherPanel.findUnique({where:{slug}})
	if (!panel) return Response.json({error:'Device not found'},{status:404})
	const base = new URL(request.url)
	const layout = normalizeLayout(panel.layout)
	const display = normalizeDisplay(layout.screenWidth, layout.screenHeight, layout.colorMode)
	const mode = COLOR_MODES[display.colorMode]
	return Response.json({
		version:1,
		deviceId:panel.id,
		refreshIntervalSeconds:panel.refreshMinutes * 60,
		screenUrl:`${base.origin}/d/${panel.slug}/screen.png`,
		screenWidth:display.width,
		screenHeight:display.height,
		colorMode:display.colorMode,
		colorCount:mode.colors,
		palette:mode.palette,
		updatedAt:panel.updatedAt.toISOString(),
	},{headers:{'Cache-Control':'no-store'}})
}
