import {DEFAULT_LAYOUT, normalizeLayout, type LanguageCode, type PanelLayout, type UnitSystemCode} from './panel-config'

export type WeatherSettings = {
	cityName: string
	latitude: number
	longitude: number
	timezone: string
	language: LanguageCode
	unitSystem: UnitSystemCode
	layout: unknown
}

export const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
	cityName: 'Махачкала', latitude: 42.9849, longitude: 47.5047,
	timezone: 'Europe/Moscow', language: 'RU', unitSystem: 'METRIC', layout: DEFAULT_LAYOUT,
}

export type WeatherForecastItem = {time: string; mark: string; temp: string}
export type WeatherScreenData = {
	city: string
	coordinates: string
	timezone: string
	temperature: number
	feelsLike: number
	high: number
	low: number
	humidity: number
	pressure: string
	precipitationProbability: number
	weatherLabel: string
	windDirection: string
	windSpeed: number
	windGust: number
	windUnit: string
	sunrise: string
	sunset: string
	uvIndex: number
	cloudCover: number
	labels: {feels:string;high:string;low:string;humidity:string;pressure:string;precipitation:string;wind:string;gusts:string;sunrise:string;sunset:string;uv:string;clouds:string}
	forecast: WeatherForecastItem[]
	layout: PanelLayout
}

type OpenMeteoResponse = {
	current: {time:string;temperature_2m:number;apparent_temperature:number;relative_humidity_2m:number;surface_pressure:number;weather_code:number;wind_speed_10m:number;wind_direction_10m:number;wind_gusts_10m:number;cloud_cover:number}
	hourly: {time: string[]; temperature_2m: number[]; weather_code: number[]}
	daily: {temperature_2m_max:number[];temperature_2m_min:number[];precipitation_probability_max:number[];sunrise:string[];sunset:string[];uv_index_max:number[]}
}

const weatherLabels: Record<LanguageCode, Record<number, string>> = {
	EN: {0:'CLEAR',1:'MOSTLY CLEAR',2:'PARTLY CLOUDY',3:'OVERCAST',45:'FOG',48:'RIME FOG',51:'LIGHT DRIZZLE',53:'DRIZZLE',55:'HEAVY DRIZZLE',56:'FREEZING DRIZZLE',57:'FREEZING DRIZZLE',61:'LIGHT RAIN',63:'RAIN',65:'HEAVY RAIN',66:'FREEZING RAIN',67:'FREEZING RAIN',71:'LIGHT SNOW',73:'SNOW',75:'HEAVY SNOW',77:'SNOW GRAINS',80:'RAIN SHOWERS',81:'RAIN SHOWERS',82:'HEAVY SHOWERS',85:'SNOW SHOWERS',86:'SNOW SHOWERS',95:'THUNDERSTORM',96:'STORM / HAIL',99:'STORM / HAIL'},
	RU: {0:'ЯСНО',1:'ПОЧТИ ЯСНО',2:'ПЕРЕМЕННАЯ ОБЛАЧНОСТЬ',3:'ПАСМУРНО',45:'ТУМАН',48:'ИЗМОРОЗЬ',51:'СЛАБАЯ МОРОСЬ',53:'МОРОСЬ',55:'СИЛЬНАЯ МОРОСЬ',56:'ЛЕДЯНАЯ МОРОСЬ',57:'ЛЕДЯНАЯ МОРОСЬ',61:'СЛАБЫЙ ДОЖДЬ',63:'ДОЖДЬ',65:'СИЛЬНЫЙ ДОЖДЬ',66:'ЛЕДЯНОЙ ДОЖДЬ',67:'ЛЕДЯНОЙ ДОЖДЬ',71:'СЛАБЫЙ СНЕГ',73:'СНЕГ',75:'СИЛЬНЫЙ СНЕГ',77:'СНЕЖНАЯ КРУПА',80:'ЛИВЕНЬ',81:'ЛИВЕНЬ',82:'СИЛЬНЫЙ ЛИВЕНЬ',85:'СНЕГОПАД',86:'СНЕГОПАД',95:'ГРОЗА',96:'ГРОЗА / ГРАД',99:'ГРОЗА / ГРАД'},
}

const uiLabels = {
	EN: {feels:'FEELS LIKE',high:'HIGH',low:'LOW',humidity:'HUMIDITY',pressure:'PRESSURE',precipitation:'PRECIPITATION',wind:'WIND',gusts:'GUSTS',sunrise:'SUNRISE',sunset:'SUNSET',uv:'UV INDEX',clouds:'CLOUD COVER'},
	RU: {feels:'ОЩУЩАЕТСЯ',high:'МАКС',low:'МИН',humidity:'ВЛАЖНОСТЬ',pressure:'ДАВЛЕНИЕ',precipitation:'ОСАДКИ',wind:'ВЕТЕР',gusts:'ПОРЫВЫ',sunrise:'ВОСХОД',sunset:'ЗАКАТ',uv:'УФ-ИНДЕКС',clouds:'ОБЛАЧНОСТЬ'},
} satisfies Record<LanguageCode, WeatherScreenData['labels']>

const labelFor = (language: LanguageCode, code: number) => weatherLabels[language][code] ?? (language === 'RU' ? 'НЕИЗВЕСТНО' : 'UNKNOWN')
const convertTemperature = (celsius: number, units: UnitSystemCode) => units === 'IMPERIAL' ? celsius * 9 / 5 + 32 : celsius
const convertWind = (metersPerSecond: number, units: UnitSystemCode) => units === 'IMPERIAL' ? metersPerSecond * 2.236936 : metersPerSecond
const formatTemperature = (value: number) => {const rounded=Math.round(value); return `${rounded>0?'+':''}${rounded}°`}
const windDirection = (degrees: number, language: LanguageCode) => {
	const values = language === 'RU' ? ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'] : ['N','NE','E','SE','S','SW','W','NW']
	return values[Math.round(degrees / 45) % values.length]
}

export async function getWeatherScreenData(settings: WeatherSettings = DEFAULT_WEATHER_SETTINGS): Promise<WeatherScreenData> {
	const params = new URLSearchParams({
		latitude:String(settings.latitude), longitude:String(settings.longitude),
		current:'temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover',
		hourly:'temperature_2m,weather_code', daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max',
		timezone:settings.timezone, forecast_days:'2', wind_speed_unit:'ms',
	})
	const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {cache:'no-store', signal:AbortSignal.timeout(15_000)})
	if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`)
	const data = (await response.json()) as OpenMeteoResponse
	const foundIndex = data.hourly.time.findIndex(time => time >= data.current.time)
	const currentIndex = foundIndex < 0 ? 0 : foundIndex
	const forecast = [0,3,6,9].map(offset => {
		const index = Math.min(currentIndex + offset, data.hourly.time.length - 1)
		return {time:data.hourly.time[index].slice(11,16), mark:labelFor(settings.language,data.hourly.weather_code[index]), temp:formatTemperature(convertTemperature(data.hourly.temperature_2m[index],settings.unitSystem))}
	})
	const pressure = settings.unitSystem === 'IMPERIAL'
		? `${(data.current.surface_pressure * 0.029529983).toFixed(2)} inHg`
		: `${Math.round(data.current.surface_pressure * 0.750061683)} мм`
	return {
		city:settings.cityName.toUpperCase(), timezone:settings.timezone,
		coordinates:`${Math.abs(settings.latitude).toFixed(2)} ${settings.latitude>=0?'N':'S'} / ${Math.abs(settings.longitude).toFixed(2)} ${settings.longitude>=0?'E':'W'}`,
		temperature:Math.round(convertTemperature(data.current.temperature_2m,settings.unitSystem)),
		feelsLike:Math.round(convertTemperature(data.current.apparent_temperature,settings.unitSystem)),
		high:Math.round(convertTemperature(data.daily.temperature_2m_max[0],settings.unitSystem)),
		low:Math.round(convertTemperature(data.daily.temperature_2m_min[0],settings.unitSystem)),
		humidity:Math.round(data.current.relative_humidity_2m), pressure,
		precipitationProbability:Math.round(data.daily.precipitation_probability_max[0]),
		weatherLabel:labelFor(settings.language,data.current.weather_code),
		windDirection:windDirection(data.current.wind_direction_10m,settings.language),
		windSpeed:Math.round(convertWind(data.current.wind_speed_10m,settings.unitSystem)),
		windGust:Math.round(convertWind(data.current.wind_gusts_10m,settings.unitSystem)),
		sunrise:data.daily.sunrise[0].slice(11,16),sunset:data.daily.sunset[0].slice(11,16),uvIndex:Number(data.daily.uv_index_max[0].toFixed(1)),cloudCover:Math.round(data.current.cloud_cover),
		windUnit:settings.unitSystem === 'IMPERIAL' ? 'mph' : 'м/с', labels:uiLabels[settings.language], forecast,
		layout:normalizeLayout(settings.layout),
	}
}
