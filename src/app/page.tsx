import {WeatherScreen} from '@/components/weather-screen'
import {getWeatherScreenData} from '@/lib/weather'

export const dynamic = 'force-dynamic'

export default async function Home() {
	const weather = await getWeatherScreenData()
	return (
		<main className="screen-stage">
			<div className="screen-scale"><WeatherScreen weather={weather} /></div>
		</main>
	)
}
