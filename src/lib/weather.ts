export type WeatherForecastItem = {time: string; mark: string; temp: string}

export type WeatherScreenData = {
	city: string
	coordinates: string
	temperature: number
	feelsLike: number
	high: number
	low: number
	humidity: number
	pressureMm: number
	precipitationProbability: number
	weatherLabel: string
	windDirection: string
	windSpeed: number
	windGust: number
	forecast: WeatherForecastItem[]
}

type OpenMeteoResponse = {
	current: {
		time: string
		temperature_2m: number
		apparent_temperature: number
		relative_humidity_2m: number
		surface_pressure: number
		weather_code: number
		wind_speed_10m: number
		wind_direction_10m: number
		wind_gusts_10m: number
	}
	hourly: {time: string[]; temperature_2m: number[]; weather_code: number[]}
	daily: {temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]}
}

const LATITUDE = 42.9849
const LONGITUDE = 47.5047
const weatherLabels: Record<number, string> = {
	0: 'CLEAR', 1: 'MOSTLY CLEAR', 2: 'PARTLY CLOUDY', 3: 'OVERCAST',
	45: 'FOG', 48: 'RIME FOG', 51: 'LIGHT DRIZZLE', 53: 'DRIZZLE', 55: 'HEAVY DRIZZLE',
	56: 'FREEZING DRIZZLE', 57: 'FREEZING DRIZZLE', 61: 'LIGHT RAIN', 63: 'RAIN', 65: 'HEAVY RAIN',
	66: 'FREEZING RAIN', 67: 'FREEZING RAIN', 71: 'LIGHT SNOW', 73: 'SNOW', 75: 'HEAVY SNOW',
	77: 'SNOW GRAINS', 80: 'RAIN SHOWERS', 81: 'RAIN SHOWERS', 82: 'HEAVY SHOWERS',
	85: 'SNOW SHOWERS', 86: 'SNOW SHOWERS', 95: 'THUNDERSTORM', 96: 'STORM / HAIL', 99: 'STORM / HAIL',
}

const weatherLabel = (code: number) => weatherLabels[code] ?? 'UNKNOWN'
const formatTemperature = (value: number) => {
	const rounded = Math.round(value)
	return `${rounded > 0 ? '+' : ''}${rounded}°`
}
const windDirection = (degrees: number) => {
	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
	return directions[Math.round(degrees / 45) % directions.length]
}

export async function getWeatherScreenData(): Promise<WeatherScreenData> {
	const params = new URLSearchParams({
		latitude: String(LATITUDE), longitude: String(LONGITUDE),
		current: 'temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
		hourly: 'temperature_2m,weather_code',
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
		timezone: 'Europe/Moscow', forecast_days: '2', wind_speed_unit: 'ms',
	})
	const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
		cache: 'no-store', signal: AbortSignal.timeout(15_000),
	})
	if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`)

	const data = (await response.json()) as OpenMeteoResponse
	const foundIndex = data.hourly.time.findIndex(time => time >= data.current.time)
	const currentIndex = foundIndex < 0 ? 0 : foundIndex
	const forecast = [0, 3, 6, 9].map(offset => {
		const index = Math.min(currentIndex + offset, data.hourly.time.length - 1)
		return {
			time: data.hourly.time[index].slice(11, 16),
			mark: weatherLabel(data.hourly.weather_code[index]),
			temp: formatTemperature(data.hourly.temperature_2m[index]),
		}
	})

	return {
		city: 'MAKHACHKALA', coordinates: '42.98 N / 47.50 E',
		temperature: Math.round(data.current.temperature_2m),
		feelsLike: Math.round(data.current.apparent_temperature),
		high: Math.round(data.daily.temperature_2m_max[0]),
		low: Math.round(data.daily.temperature_2m_min[0]),
		humidity: Math.round(data.current.relative_humidity_2m),
		pressureMm: Math.round(data.current.surface_pressure * 0.750061683),
		precipitationProbability: Math.round(data.daily.precipitation_probability_max[0]),
		weatherLabel: weatherLabel(data.current.weather_code),
		windDirection: windDirection(data.current.wind_direction_10m),
		windSpeed: Math.round(data.current.wind_speed_10m),
		windGust: Math.round(data.current.wind_gusts_10m),
		forecast,
	}
}
