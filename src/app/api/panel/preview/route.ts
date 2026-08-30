import {z} from 'zod'
import {getCurrentUser} from '@/lib/auth'
import {demoDeviceBatteryPercent,demoDeviceSensor} from '@/lib/device-sensor'
import {BLOCK_IDS,MAX_BLOCKS,layoutFits,normalizeLayout,type PanelLayout} from '@/lib/panel-config'
import {prisma} from '@/lib/prisma'
import {demoSensorLog, parseSensorLog} from '@/lib/sensor-log'
import {getWeatherScreenData} from '@/lib/weather'

const schema=z.object({
	cityName:z.string().trim().min(1).max(120),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),timezone:z.string().min(1).max(80),
	language:z.enum(['RU','EN']),unitSystem:z.enum(['METRIC','IMPERIAL']),
	layout:z.object({blocks:z.array(z.enum(BLOCK_IDS)).min(1).max(MAX_BLOCKS),spans:z.record(z.string(),z.number().int().min(1).max(4)),rowSpans:z.record(z.string(),z.number().int().min(1).max(2)).optional(),ranges:z.record(z.string(),z.enum(['day','days3','week','weeks2','month'])).optional(),sensorChartRange:z.enum(['hour','hours3','hours6','hours12','hours23','hours24','days3','week','month']).optional(),photoDataUrl:z.string().max(1_500_000).regex(/^data:image\/(?:png|jpeg|webp);base64,/).optional(),fontSize:z.number().int().min(80).max(200).optional(),theme:z.enum(['classic','night','poster','air','rail']).optional(),cornerRadius:z.number().int().min(0).max(32).optional(),cardGap:z.number().int().min(0).max(28).optional(),showBorder:z.boolean().optional(),showFrame:z.boolean().optional(),sensor:z.object({pressure:z.boolean(),altitude:z.boolean(),humidity:z.boolean()}).optional(),header:z.object({visible:z.boolean(),showCity:z.boolean(),showCoords:z.boolean(),showDate:z.boolean(),showTime:z.boolean(),showBattery:z.boolean(),title:z.string().trim().max(48).optional(),style:z.enum(['fill','invert','line']),size:z.enum(['s','m','l'])}).optional()}).refine(value=>layoutFits(value as PanelLayout)),
})

export async function POST(request:Request){
	const user=await getCurrentUser()
	if(!user)return Response.json({error:'Требуется вход'},{status:401})
	try{
		const settings=schema.parse(await request.json())
		const weather=await getWeatherScreenData(settings)
		const layout=normalizeLayout(settings.layout)
		weather.sensor=layout.blocks.includes('sensor')
			? demoDeviceSensor(settings.unitSystem)
			: null
		const panel=await prisma.weatherPanel.findFirst({where:{userId:user.id}})
		const stored=parseSensorLog(panel?.sensorLog)
		weather.sensorTempLog=stored.length?stored:demoSensorLog()
		weather.batteryPercent=demoDeviceBatteryPercent()
		return Response.json(weather,{headers:{'Cache-Control':'no-store'}})
	}
	catch(error){if(error instanceof z.ZodError)return Response.json({error:'Некорректные настройки preview'},{status:400});console.error('Preview weather failed:',error);return Response.json({error:'Не удалось обновить preview'},{status:502})}
}
