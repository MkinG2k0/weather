import { fetchWeatherApi } from 'openmeteo'
import { NextResponse } from 'next/server'

function mapWeatherCodeToOWM(code: number) {
	const mapping: Record<number, { main: string; description: string; icon: string }> = {
		0: {main: 'Clear', description: 'clear sky', icon: '01d'},
		1: {main: 'Mainly Clear', description: 'mostly clear', icon: '02d'},
		2: {main: 'Partly Cloudy', description: 'partly cloudy', icon: '03d'},
		3: {main: 'Overcast', description: 'overcast clouds', icon: '04d'},
		45: {main: 'Fog', description: 'foggy', icon: '50d'},
		48: {main: 'Depositing Rime Fog', description: 'rime fog', icon: '50d'},
		51: {main: 'Drizzle', description: 'light drizzle', icon: '09d'},
		53: {main: 'Drizzle', description: 'moderate drizzle', icon: '09d'},
		55: {main: 'Drizzle', description: 'dense drizzle', icon: '09d'},
		56: {main: 'Freezing Drizzle', description: 'light freezing drizzle', icon: '13d'},
		57: {main: 'Freezing Drizzle', description: 'dense freezing drizzle', icon: '13d'},
		61: {main: 'Rain', description: 'light rain', icon: '10d'},
		63: {main: 'Rain', description: 'moderate rain', icon: '10d'},
		65: {main: 'Rain', description: 'heavy rain', icon: '10d'},
		66: {main: 'Freezing Rain', description: 'light freezing rain', icon: '13d'},
		67: {main: 'Freezing Rain', description: 'heavy freezing rain', icon: '13d'},
		71: {main: 'Snow', description: 'light snow', icon: '13d'},
		73: {main: 'Snow', description: 'moderate snow', icon: '13d'},
		75: {main: 'Snow', description: 'heavy snow', icon: '13d'},
		77: {main: 'Snow Grains', description: 'snow grains', icon: '13d'},
		80: {main: 'Rain Showers', description: 'light rain showers', icon: '09d'},
		81: {main: 'Rain Showers', description: 'moderate rain showers', icon: '09d'},
		82: {main: 'Rain Showers', description: 'violent rain showers', icon: '09d'},
		85: {main: 'Snow Showers', description: 'light snow showers', icon: '13d'},
		86: {main: 'Snow Showers', description: 'heavy snow showers', icon: '13d'},
		95: {main: 'Thunderstorm', description: 'thunderstorm', icon: '11d'},
		96: {main: 'Thunderstorm', description: 'thunderstorm with hail', icon: '11d'},
		99: {main: 'Thunderstorm', description: 'violent thunderstorm with hail', icon: '11d'},
	}

	return (
		mapping[code] || {
			main: 'Unknown',
			description: 'unknown weather',
			icon: '01d',
		}
	)
}
	
export const GET = async (request: Request) => {
	const {searchParams} = new URL(request.url)
	const dateStr = searchParams.get('date')

	const params = {
		current: [
			'temperature_2m',
			'wind_speed_10m',
			'rain',
			'weather_code',
			'relative_humidity_2m',
			'apparent_temperature',
			'wind_direction_10m',
			'wind_gusts_10m',
			'precipitation',
			'showers',
			'snowfall',
			'cloud_cover',
			'pressure_msl',
			'surface_pressure',
			'is_day',
		],
		daily: [
			'temperature_2m_max',
			'temperature_2m_min',
			'weather_code',
			'sunrise',
			'sunset',
			'daylight_duration',
			'sunshine_duration',
			'uv_index_max',
			'uv_index_clear_sky_max',
			'rain_sum',
			'showers_sum',
			'snowfall_sum',
			'precipitation_sum',
			'precipitation_hours',
			'precipitation_probability_max',
			'shortwave_radiation_sum',
			'wind_direction_10m_dominant',
			'wind_gusts_10m_max',
			'wind_speed_10m_max',
			'et0_fao_evapotranspiration',
			'apparent_temperature_max',
			'apparent_temperature_min',
		],

		hourly: [
			'temperature_2m',
			'weather_code',
			'relative_humidity_2m',
			'dew_point_2m',
			'apparent_temperature',
			'precipitation_probability',
			'precipitation',
			'rain',
			'showers',
			'snowfall',
			'snow_depth',
			'pressure_msl',
			'surface_pressure',
			'cloud_cover',
			'cloud_cover_low',
			'cloud_cover_mid',
			'cloud_cover_high',
			'visibility',
			'evapotranspiration',
			'et0_fao_evapotranspiration',
			'vapour_pressure_deficit',
			'wind_speed_10m',
			'wind_direction_10m',
			'wind_gusts_10m',
		],

		latitude: 42.8804,
		longitude: 47.5504,
		timezone: 'Europe/Moscow',
	}
	const url = 'https://api.open-meteo.com/v1/forecast'
	const responses = await fetchWeatherApi(url, params)

	// Process first location. Add a for-loop for multiple locations or weather models
	const response = responses[0]

	// Attributes for timezone and location
	const utcOffsetSeconds = response.utcOffsetSeconds()
	const timezone = response.timezone()
	const timezoneAbbreviation = response.timezoneAbbreviation()

	const hourly = response.hourly()!
	const current = response.current()!
	const daily = response.daily()!

	//
	const getValue = (val: number) => {
		return Number(current.variables(val)!.value().toFixed(2))
	}

	const currentWeather = {
		// Время (переводим из UNIX и учитываем смещение по UTC)
		dt: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
		// Температура воздуха
		temp: current.variables(0)!.value(), // temperature2m
		// Ощущаемая температура
		feels_like: current.variables(5)!.value(), // apparentTemperature
		// Давление на уровне моря
		pressure: current.variables(12)!.value(), // pressureMsl
		// Влажность воздуха
		humidity: current.variables(4)!.value(), // relativeHumidity2m
		// Направление ветра
		wind_deg: current.variables(6)!.value(), // windDirection10m
		// Скорость ветра
		wind_speed: current.variables(1)!.value(), // windSpeed10m
		// Порывы ветра
		wind_gust: current.variables(7)!.value(), // windGusts10m
		// Облачность
		clouds: current.variables(11)!.value(), // cloudCover
		// Код погоды
		weather: [
			{
				id: 803, // weatherCode
				main: '04d', // Можно сопоставить по таблице weatherCode → main
				description: 'broken clouds', // Аналогично
				icon: 'Clouds', // Можем тоже замапить
			},
		],
		// Осадки (общее количество)
		precipitation: current.variables(8)!.value(), // precipitation
		// Дождь
		rain: current.variables(2)!.value(), // rain
		// Ливни
		showers: current.variables(9)!.value(), // showers
		// Снег
		snowfall: current.variables(10)!.value(), // snowfall
		// Давление на поверхности (если нужно)
		surface_pressure: current.variables(13)!.value(), // surfacePressure
		// День или ночь (0 или 1)
		is_day: current.variables(14)!.value(), // isDay
	}

	const sunrise = daily.variables(3)!
	const sunset = daily.variables(4)!

	const dailySunrise = [...Array(sunrise.valuesInt64Length())].map(
		(_, i) => new Date((Number(sunrise.valuesInt64(i)) + utcOffsetSeconds) * 1000),
	)
	const dailySunset = [...Array(sunset.valuesInt64Length())].map(
		(_, i) => new Date((Number(sunset.valuesInt64(i)) + utcOffsetSeconds) * 1000),
	)

	const dailyMock = [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())]

	const mappedDaily = dailyMock.map((time, i) => ({
		dt: time,

		sunrise: new Date((Number(dailySunrise[i]) + utcOffsetSeconds) * 1000),
		sunset: new Date((Number(dailySunset[i]) + utcOffsetSeconds) * 1000),

		temp: {
			min: daily.variables(1)!.valuesArray()![i],
			max: daily.variables(0)!.valuesArray()![i],
		},

		feels_like: {
			day: daily.variables(20)!.valuesArray()![i],
			night: daily.variables(21)!.valuesArray()![i],
			morn: daily.variables(21)!.valuesArray()![i], // нет деления, поэтому дублируем
			eve: daily.variables(20)!.valuesArray()![i],
		},

		pressure: null, // нет в daily
		humidity: null, // нет в daily

		weather: [
			{
				id: daily.variables(2)!.valuesArray()![i],
				...mapWeatherCodeToOWM(daily.variables(2)!.valuesArray()![i]),
			},
		],

		wind_speed: daily.variables(18)!.valuesArray()![i],
		wind_deg: daily.variables(16)!.valuesArray()![i],
		wind_gust: daily.variables(17)!.valuesArray()![i],

		clouds: null, // нет в daily
		pop: daily.variables(14)!.valuesArray()![i] / 100,

		rain: daily.variables(9)!.valuesArray()![i],
		snow: daily.variables(11)!.valuesArray()![i],

		uvi: daily.variables(7)!.valuesArray()![i],
	}))

	const hourlyMock = [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())]

	const mappedHourly = hourlyMock.map((time, i) => ({
		dt: time, // UNIX timestamp или Date — зависит от требований

		temp: hourly.variables(0)!.valuesArray()![i], // temperature2m
		feels_like: hourly.variables(4)!.valuesArray()![i], // apparentTemperature

		pressure: hourly.variables(11)!.valuesArray()![i], // pressureMsl
		humidity: hourly.variables(2)!.valuesArray()![i], // relativeHumidity2m

		dew_point: hourly.variables(3)!.valuesArray()![i], // dewPoint2m

		clouds: hourly.variables(13)!.valuesArray()![i], // cloudCover

		visibility: hourly.variables(17)!.valuesArray()![i], // visibility

		wind_speed: hourly.variables(21)!.valuesArray()![i], // windSpeed10m
		wind_deg: hourly.variables(22)!.valuesArray()![i],
		wind_gust: hourly.variables(23)!.valuesArray()![i],

		pop: hourly.variables(5)!.valuesArray()![i] / 100, // precipitationProbability

		rain: {
			'1h': hourly.variables(7)!.valuesArray()![i], // rain
		},

		snow: {
			'1h': hourly.variables(9)!.valuesArray()![i], // snowfall
		},

		weather: [
			{
				id: hourly.variables(1)!.valuesArray()![i],
				...mapWeatherCodeToOWM(hourly.variables(1)!.valuesArray()![i]),
			},
		],
	}))

	return NextResponse.json({
		current: currentWeather,
		daily: mappedDaily,
		hourly: mappedHourly,
		lat: 42.8804,
		lon: 47.5504,
		timezone: 'Europe/Moscow',
		timezone_offset: 3000,
		alerts: [
			{
				description: '',
				end: 1684988747,
				event: 'Dagestan state',
				sender_name: '',
				start: 0,
				tags: [],
			},
		],
	})
}
