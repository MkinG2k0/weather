import {createHash} from 'node:crypto'
import {parseDeviceBatteryPercent,parseDeviceSensor} from '@/lib/device-sensor'
import {getCacheScreen,getQuietHours,nextRefreshSeconds,normalizeLayout} from '@/lib/panel-config'
import {prisma} from '@/lib/prisma'
import {incomingSensorPoints, mergeSensorLog} from '@/lib/sensor-log'
import {getWeatherScreenData} from '@/lib/weather'
import {renderWeatherDataImage,weatherImageResponse} from '@/lib/weather-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function localObservedAt(timezone:string) {
	const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
	const get=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value??'00'
	return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
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
		weather.batteryPercent=parseDeviceBatteryPercent(request.url)
		const incoming=incomingSensorPoints(request.url)
		const merged=mergeSensorLog(panel.sensorLog, incoming)
		if(incoming.length){
			await prisma.weatherPanel.update({where:{id:panel.id},data:{sensorLog:merged}})
		}
		weather.sensorTempLog=layout.blocks.includes('sensorChart')?merged:[]
		const cacheScreen=getCacheScreen(layout)
		if(!cacheScreen)weather.observedAt=localObservedAt(panel.timezone)
		const etag=`"${createHash('sha256').update(JSON.stringify(weather)).digest('hex')}"`
		const responseHeaders={
			'Cache-Control':'no-store',
			'X-Next-Refresh-Seconds':String(nextRefreshSeconds(panel.refreshMinutes,panel.timezone,getQuietHours(layout))),
			...(cacheScreen?{ETag:etag}:{}),
		}
		if(cacheScreen&&request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:responseHeaders})
		return weatherImageResponse(await renderWeatherDataImage(weather),responseHeaders)
	} catch(error) {
		console.error('Personal weather image failed:',error)
		const detail=error instanceof Error?error.message:String(error)
		return Response.json({error:'Failed to generate weather screen',detail},{status:500})
	}
}
