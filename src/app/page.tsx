import {headers} from 'next/headers'
import {AuthPanel} from '@/components/auth-panel'
import {PanelEditor} from '@/components/panel-editor'
import {getCurrentUser} from '@/lib/auth'
import {demoDeviceSensor} from '@/lib/device-sensor'
import {serializePanel} from '@/lib/panel-data'
import {prisma} from '@/lib/prisma'
import {getWeatherScreenData} from '@/lib/weather'

export const dynamic='force-dynamic'

export default async function Home(){
	const hasUsers=(await prisma.user.count())>0
	if(!hasUsers)return <AuthPanel setup/>
	const user=await getCurrentUser()
	if(!user)return <AuthPanel setup={false}/>
	const panel=await prisma.weatherPanel.findFirst({where:{userId:user.id}})
	if(!panel)throw new Error('Weather panel is missing')
	const weather=await getWeatherScreenData(panel)
	if(weather.layout.blocks.includes('sensor'))weather.sensor=demoDeviceSensor(panel.unitSystem)
	const requestHeaders=await headers()
	const protocol=requestHeaders.get('x-forwarded-proto')??'http'
	const host=requestHeaders.get('x-forwarded-host')??requestHeaders.get('host')??'localhost:3000'
	return <PanelEditor initialPanel={serializePanel(panel)} initialWeather={weather} origin={`${protocol}://${host}`} username={user.username}/>
}
