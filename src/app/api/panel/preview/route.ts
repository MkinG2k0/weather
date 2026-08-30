import {z} from 'zod'
import {getCurrentUser} from '@/lib/auth'
import {BLOCK_IDS,MAX_BLOCKS} from '@/lib/panel-config'
import {getWeatherScreenData} from '@/lib/weather'

const schema=z.object({
	cityName:z.string().trim().min(1).max(120),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),timezone:z.string().min(1).max(80),
	language:z.enum(['RU','EN']),unitSystem:z.enum(['METRIC','IMPERIAL']),
	layout:z.object({blocks:z.array(z.enum(BLOCK_IDS)).min(1).max(MAX_BLOCKS)}),
})

export async function POST(request:Request){
	if(!(await getCurrentUser()))return Response.json({error:'Требуется вход'},{status:401})
	try{return Response.json(await getWeatherScreenData(schema.parse(await request.json())),{headers:{'Cache-Control':'no-store'}})}
	catch(error){if(error instanceof z.ZodError)return Response.json({error:'Некорректные настройки preview'},{status:400});console.error('Preview weather failed:',error);return Response.json({error:'Не удалось обновить preview'},{status:502})}
}
