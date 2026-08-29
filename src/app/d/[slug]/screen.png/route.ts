import {prisma} from '@/lib/prisma'
import {renderWeatherImage,weatherImageResponse} from '@/lib/weather-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}) {
	try {
		const {slug}=await params
		const panel=await prisma.weatherPanel.findUnique({where:{slug}})
		if(!panel) return Response.json({error:'Device not found'},{status:404})
		return weatherImageResponse(await renderWeatherImage(panel))
	} catch(error) {
		console.error('Personal weather image failed:',error)
		return Response.json({error:'Failed to generate weather screen'},{status:500})
	}
}
