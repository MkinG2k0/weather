import {createHash} from 'node:crypto'
import {parseDeviceSensor} from '@/lib/device-sensor'
import {normalizeLayout} from '@/lib/panel-config'
import {prisma} from '@/lib/prisma'
import {getWeatherScreenData} from '@/lib/weather'
import {renderWeatherDataImage,weatherImageResponse} from '@/lib/weather-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function localHour(timezone:string) {
	const hour=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hour12:false}).format(new Date())
	return Number.parseInt(hour,10)%24
}

function nextRefreshSeconds(refreshMinutes:number,timezone:string) {
	const regularSeconds=refreshMinutes*60
	const hour=localHour(timezone)
	return hour>=23||hour<6 ? Math.max(regularSeconds,60*60) : regularSeconds
}

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}) {
	try {
		const {slug}=await params
		const panel=await prisma.weatherPanel.findUnique({where:{slug}})
		if(!panel) return Response.json({error:'Device not found'},{status:404})
		const weather=await getWeatherScreenData(panel)
		const layout=normalizeLayout(panel.layout)
		weather.sensor=layout.blocks.includes('sensor')
			? parseDeviceSensor(request.url, panel.unitSystem)
			: null
		const etag=`"${createHash('sha256').update(JSON.stringify(weather)).digest('hex')}"`
		const responseHeaders={
			'Cache-Control':'no-store',
			'ETag':etag,
			'X-Next-Refresh-Seconds':String(nextRefreshSeconds(panel.refreshMinutes,panel.timezone)),
		}
		if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:responseHeaders})
		return weatherImageResponse(await renderWeatherDataImage(weather),responseHeaders)
	} catch(error) {
		console.error('Personal weather image failed:',error)
		return Response.json({error:'Failed to generate weather screen'},{status:500})
	}
}
