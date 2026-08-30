import type {DeviceSensorReading} from './device-sensor'
import {buildDisplay, DEFAULT_COLOR_MODE, DEFAULT_SCREEN_HEIGHT, DEFAULT_SCREEN_WIDTH, type PanelDisplay} from './display'
import {DEFAULT_LAYOUT, normalizeLayout, type LanguageCode, type PanelLayout, type UnitSystemCode} from './panel-config'

export type WeatherSettings = {
	cityName: string
	latitude: number
	longitude: number
	timezone: string
	language: LanguageCode
	unitSystem: UnitSystemCode
	layout: unknown
	screenWidth?: number
	screenHeight?: number
	colorMode?: string
}

export const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
	cityName: 'Махачкала', latitude: 42.9849, longitude: 47.5047,
	timezone: 'Europe/Moscow', language: 'RU', unitSystem: 'METRIC', layout: DEFAULT_LAYOUT,
}

export type WeatherForecastItem = {time: string; mark: string; temp: string}
export type WeatherHourlyPoint = {time:string;temperature:number;feelsLike:number;precipitationProbability:number;precipitation:number;windSpeed:number;windGust:number;humidity:number;pressure:number;cloudCover:number;visibility:number}
export type WeatherDailyItem = {day:string;weatherCode:number;weatherLabel:string;high:number;low:number;precipitationProbability:number;precipitationSum:number;windSpeedMax:number}
export type WeatherScreenData = {
	city: string
	coordinates: string
	timezone: string
	observedAt: string
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
	cloudCoverLow:number
	cloudCoverMid:number
	cloudCoverHigh:number
	dewPoint:number
	visibility:number
	visibilityUnit:string
	precipitation:number
	rain:number
	showers:number
	snowfall:number
	precipitationUnit:string
	seaLevelPressure:string
	apparentHigh:number
	apparentLow:number
	precipitationSum:number
	rainSum:number
	showersSum:number
	snowfallSum:number
	precipitationHours:number
	daylightDuration:string
	sunshineDuration:string
	uvIndexClearSky:number
	windSpeedMax:number
	windGustMax:number
	windDirectionDominant:string
	shortwaveRadiationSum:number
	evapotranspiration:number
	isDay:boolean
	temperatureUnit:string
	airQuality:{europeanAqi:number;usAqi:number;pm10:number;pm25:number;carbonMonoxide:number;nitrogenDioxide:number;sulphurDioxide:number;ozone:number}|null
	labels: {feels:string;high:string;low:string;humidity:string;pressure:string;precipitation:string;wind:string;gusts:string;sunrise:string;sunset:string;uv:string;clouds:string;visibility:string;dewPoint:string;daylight:string;sunshine:string;radiation:string;airQuality:string}
	forecast: WeatherForecastItem[]
	hourly:WeatherHourlyPoint[]
	daily:WeatherDailyItem[]
	layout: PanelLayout
	display: PanelDisplay
	sensor: DeviceSensorReading | null
}

type OpenMeteoResponse = {
	current: {time:string;temperature_2m:number;apparent_temperature:number;relative_humidity_2m:number;dew_point_2m:number;surface_pressure:number;pressure_msl:number;weather_code:number;wind_speed_10m:number;wind_direction_10m:number;wind_gusts_10m:number;cloud_cover:number;cloud_cover_low:number;cloud_cover_mid:number;cloud_cover_high:number;visibility:number;precipitation:number;rain:number;showers:number;snowfall:number;is_day:number}
	hourly: {time:string[];temperature_2m:number[];apparent_temperature:number[];relative_humidity_2m:number[];surface_pressure:number[];precipitation_probability:number[];precipitation:number[];weather_code:number[];cloud_cover:number[];visibility:number[];wind_speed_10m:number[];wind_gusts_10m:number[]}
	daily: {time:string[];weather_code:number[];temperature_2m_max:number[];temperature_2m_min:number[];apparent_temperature_max:number[];apparent_temperature_min:number[];precipitation_probability_max:number[];precipitation_sum:number[];rain_sum:number[];showers_sum:number[];snowfall_sum:number[];precipitation_hours:number[];sunrise:string[];sunset:string[];daylight_duration:number[];sunshine_duration:number[];uv_index_max:number[];uv_index_clear_sky_max:number[];wind_speed_10m_max:number[];wind_gusts_10m_max:number[];wind_direction_10m_dominant:number[];shortwave_radiation_sum:number[];et0_fao_evapotranspiration:number[]}
}

type AirQualityResponse={current:{european_aqi:number;us_aqi:number;pm10:number;pm2_5:number;carbon_monoxide:number;nitrogen_dioxide:number;sulphur_dioxide:number;ozone:number}}

const weatherLabels: Record<LanguageCode, Record<number, string>> = {
	EN: {0:'CLEAR',1:'MOSTLY CLEAR',2:'PARTLY CLOUDY',3:'OVERCAST',45:'FOG',48:'RIME FOG',51:'LIGHT DRIZZLE',53:'DRIZZLE',55:'HEAVY DRIZZLE',56:'FREEZING DRIZZLE',57:'FREEZING DRIZZLE',61:'LIGHT RAIN',63:'RAIN',65:'HEAVY RAIN',66:'FREEZING RAIN',67:'FREEZING RAIN',71:'LIGHT SNOW',73:'SNOW',75:'HEAVY SNOW',77:'SNOW GRAINS',80:'RAIN SHOWERS',81:'RAIN SHOWERS',82:'HEAVY SHOWERS',85:'SNOW SHOWERS',86:'SNOW SHOWERS',95:'THUNDERSTORM',96:'STORM / HAIL',99:'STORM / HAIL'},
	RU: {0:'ЯСНО',1:'ПОЧТИ ЯСНО',2:'ПЕРЕМЕННАЯ ОБЛАЧНОСТЬ',3:'ПАСМУРНО',45:'ТУМАН',48:'ИЗМОРОЗЬ',51:'СЛАБАЯ МОРОСЬ',53:'МОРОСЬ',55:'СИЛЬНАЯ МОРОСЬ',56:'ЛЕДЯНАЯ МОРОСЬ',57:'ЛЕДЯНАЯ МОРОСЬ',61:'СЛАБЫЙ ДОЖДЬ',63:'ДОЖДЬ',65:'СИЛЬНЫЙ ДОЖДЬ',66:'ЛЕДЯНОЙ ДОЖДЬ',67:'ЛЕДЯНОЙ ДОЖДЬ',71:'СЛАБЫЙ СНЕГ',73:'СНЕГ',75:'СИЛЬНЫЙ СНЕГ',77:'СНЕЖНАЯ КРУПА',80:'ЛИВЕНЬ',81:'ЛИВЕНЬ',82:'СИЛЬНЫЙ ЛИВЕНЬ',85:'СНЕГОПАД',86:'СНЕГОПАД',95:'ГРОЗА',96:'ГРОЗА / ГРАД',99:'ГРОЗА / ГРАД'},
}

const uiLabels = {
	EN: {feels:'FEELS LIKE',high:'HIGH',low:'LOW',humidity:'HUMIDITY',pressure:'PRESSURE',precipitation:'PRECIPITATION',wind:'WIND',gusts:'GUSTS',sunrise:'SUNRISE',sunset:'SUNSET',uv:'UV INDEX',clouds:'CLOUD COVER',visibility:'VISIBILITY',dewPoint:'DEW POINT',daylight:'DAYLIGHT',sunshine:'SUNSHINE',radiation:'SOLAR ENERGY',airQuality:'AIR QUALITY'},
	RU: {feels:'ОЩУЩАЕТСЯ',high:'МАКС',low:'МИН',humidity:'ВЛАЖНОСТЬ',pressure:'ДАВЛЕНИЕ',precipitation:'ОСАДКИ',wind:'ВЕТЕР',gusts:'ПОРЫВЫ',sunrise:'ВОСХОД',sunset:'ЗАКАТ',uv:'УФ-ИНДЕКС',clouds:'ОБЛАЧНОСТЬ',visibility:'ВИДИМОСТЬ',dewPoint:'ТОЧКА РОСЫ',daylight:'СВЕТОВОЙ ДЕНЬ',sunshine:'СОЛНЦЕ',radiation:'СОЛНЕЧНАЯ ЭНЕРГИЯ',airQuality:'КАЧЕСТВО ВОЗДУХА'},
} satisfies Record<LanguageCode, WeatherScreenData['labels']>

const labelFor = (language: LanguageCode, code: number) => weatherLabels[language][code] ?? (language === 'RU' ? 'НЕИЗВЕСТНО' : 'UNKNOWN')
const convertTemperature = (celsius: number, units: UnitSystemCode) => units === 'IMPERIAL' ? celsius * 9 / 5 + 32 : celsius
const convertWind = (metersPerSecond: number, units: UnitSystemCode) => units === 'IMPERIAL' ? metersPerSecond * 2.236936 : metersPerSecond
const formatTemperature = (value: number) => {const rounded=Math.round(value); return `${rounded>0?'+':''}${rounded}°`}
const formatDuration=(seconds:number)=>`${Math.floor(seconds/3600)}ч ${Math.round((seconds%3600)/60)}м`
const windDirection = (degrees: number, language: LanguageCode) => {
	const values = language === 'RU' ? ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'] : ['N','NE','E','SE','S','SW','W','NW']
	return values[Math.round(degrees / 45) % values.length]
}

const METEO_TTL_MS = 30_000
type MeteoBundle = {data: OpenMeteoResponse; air: AirQualityResponse | null}
const meteoCache = new Map<string, {until: number; bundle: MeteoBundle}>()
const meteoInflight = new Map<string, Promise<MeteoBundle>>()

function meteoKey(settings: WeatherSettings) {
	return `${settings.latitude}|${settings.longitude}|${settings.timezone}`
}

async function fetchOk(url: string) {
	let last: unknown
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.timeout(15_000)})
			if (response.ok || (response.status < 500 && response.status !== 429)) return response
			last = new Error(`HTTP ${response.status}`)
		} catch (error) {
			last = error
		}
		await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)))
	}
	throw last instanceof Error ? last : new Error('Weather fetch failed')
}

async function loadMeteo(settings: WeatherSettings): Promise<MeteoBundle> {
	const key = meteoKey(settings)
	const hit = meteoCache.get(key)
	if (hit && hit.until > Date.now()) return hit.bundle
	const pending = meteoInflight.get(key)
	if (pending) return pending
	const task = (async () => {
		const params = new URLSearchParams({
			latitude:String(settings.latitude), longitude:String(settings.longitude),
			current:'temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,pressure_msl,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day',
			hourly:'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m',
			daily:'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration',
			timezone:settings.timezone, forecast_days:'7', forecast_hours:'24', wind_speed_unit:'ms',
		})
		const airParams=new URLSearchParams({latitude:String(settings.latitude),longitude:String(settings.longitude),current:'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',timezone:settings.timezone})
		const [response,air] = await Promise.all([
			fetchOk(`https://api.open-meteo.com/v1/forecast?${params}`),
			fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`,{cache:'no-store',signal:AbortSignal.timeout(15_000)}).then(async response=>response.ok?(await response.json()) as AirQualityResponse:null).catch(()=>null),
		])
		if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`)
		const bundle = {data: (await response.json()) as OpenMeteoResponse, air}
		meteoCache.set(key, {until: Date.now() + METEO_TTL_MS, bundle})
		return bundle
	})()
	meteoInflight.set(key, task)
	try {
		return await task
	} finally {
		meteoInflight.delete(key)
	}
}

export async function getWeatherScreenData(settings: WeatherSettings = DEFAULT_WEATHER_SETTINGS): Promise<WeatherScreenData> {
	const {data, air: airData} = await loadMeteo(settings)
	const foundIndex = data.hourly.time.findIndex(time => time >= data.current.time)
	const currentIndex = foundIndex < 0 ? 0 : foundIndex
	const forecast = [0,3,6,9].map(offset => {
		const index = Math.min(currentIndex + offset, data.hourly.time.length - 1)
		return {time:data.hourly.time[index].slice(11,16), mark:labelFor(settings.language,data.hourly.weather_code[index]), temp:formatTemperature(convertTemperature(data.hourly.temperature_2m[index],settings.unitSystem))}
	})
	const pressure = settings.unitSystem === 'IMPERIAL'
		? `${(data.current.surface_pressure * 0.029529983).toFixed(2)} inHg`
		: `${Math.round(data.current.surface_pressure * 0.750061683)} мм`
	const seaLevelPressure=settings.unitSystem==='IMPERIAL'?`${(data.current.pressure_msl*0.029529983).toFixed(2)} inHg`:`${Math.round(data.current.pressure_msl*0.750061683)} мм`
	const precipitationFactor=settings.unitSystem==='IMPERIAL'?0.0393701:1
	const precipitationUnit=settings.unitSystem==='IMPERIAL'?'in':'мм'
	const visibilityFactor=settings.unitSystem==='IMPERIAL'?0.000621371:0.001
	const visibilityUnit=settings.unitSystem==='IMPERIAL'?'mi':'км'
	const hourly:WeatherHourlyPoint[]=data.hourly.time.map((time,index)=>({time:time.slice(11,16),temperature:Math.round(convertTemperature(data.hourly.temperature_2m[index],settings.unitSystem)),feelsLike:Math.round(convertTemperature(data.hourly.apparent_temperature[index],settings.unitSystem)),precipitationProbability:Math.round(data.hourly.precipitation_probability[index]??0),precipitation:Number(((data.hourly.precipitation[index]??0)*precipitationFactor).toFixed(2)),windSpeed:Math.round(convertWind(data.hourly.wind_speed_10m[index],settings.unitSystem)),windGust:Math.round(convertWind(data.hourly.wind_gusts_10m[index],settings.unitSystem)),humidity:Math.round(data.hourly.relative_humidity_2m[index]),pressure:Math.round(data.hourly.surface_pressure[index]*(settings.unitSystem==='IMPERIAL'?0.029529983:0.750061683)),cloudCover:Math.round(data.hourly.cloud_cover[index]),visibility:Number((data.hourly.visibility[index]*visibilityFactor).toFixed(1))}))
	const dayFormatter=new Intl.DateTimeFormat(settings.language==='RU'?'ru-RU':'en-GB',{weekday:'short',timeZone:'UTC'})
	const daily:WeatherDailyItem[]=data.daily.time.map((time,index)=>({day:dayFormatter.format(new Date(`${time}T12:00:00Z`)).toUpperCase(),weatherCode:data.daily.weather_code[index],weatherLabel:labelFor(settings.language,data.daily.weather_code[index]),high:Math.round(convertTemperature(data.daily.temperature_2m_max[index],settings.unitSystem)),low:Math.round(convertTemperature(data.daily.temperature_2m_min[index],settings.unitSystem)),precipitationProbability:Math.round(data.daily.precipitation_probability_max[index]??0),precipitationSum:Number(((data.daily.precipitation_sum[index]??0)*precipitationFactor).toFixed(1)),windSpeedMax:Math.round(convertWind(data.daily.wind_speed_10m_max[index],settings.unitSystem))}))
	const aq=airData?.current
	const layout=normalizeLayout(settings.layout)
	return {
		city:settings.cityName.toUpperCase(), timezone:settings.timezone, observedAt:data.current.time,
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
		cloudCoverLow:Math.round(data.current.cloud_cover_low),cloudCoverMid:Math.round(data.current.cloud_cover_mid),cloudCoverHigh:Math.round(data.current.cloud_cover_high),
		dewPoint:Math.round(convertTemperature(data.current.dew_point_2m,settings.unitSystem)),visibility:Number((data.current.visibility*visibilityFactor).toFixed(1)),visibilityUnit,
		precipitation:Number((data.current.precipitation*precipitationFactor).toFixed(2)),rain:Number((data.current.rain*precipitationFactor).toFixed(2)),showers:Number((data.current.showers*precipitationFactor).toFixed(2)),snowfall:Number((data.current.snowfall*precipitationFactor).toFixed(2)),precipitationUnit,seaLevelPressure,
		apparentHigh:Math.round(convertTemperature(data.daily.apparent_temperature_max[0],settings.unitSystem)),apparentLow:Math.round(convertTemperature(data.daily.apparent_temperature_min[0],settings.unitSystem)),
		precipitationSum:Number((data.daily.precipitation_sum[0]*precipitationFactor).toFixed(1)),rainSum:Number((data.daily.rain_sum[0]*precipitationFactor).toFixed(1)),showersSum:Number((data.daily.showers_sum[0]*precipitationFactor).toFixed(1)),snowfallSum:Number((data.daily.snowfall_sum[0]*precipitationFactor).toFixed(1)),precipitationHours:Number(data.daily.precipitation_hours[0].toFixed(1)),
		daylightDuration:formatDuration(data.daily.daylight_duration[0]),sunshineDuration:formatDuration(data.daily.sunshine_duration[0]),uvIndexClearSky:Number(data.daily.uv_index_clear_sky_max[0].toFixed(1)),windSpeedMax:Math.round(convertWind(data.daily.wind_speed_10m_max[0],settings.unitSystem)),windGustMax:Math.round(convertWind(data.daily.wind_gusts_10m_max[0],settings.unitSystem)),windDirectionDominant:windDirection(data.daily.wind_direction_10m_dominant[0],settings.language),shortwaveRadiationSum:Number(data.daily.shortwave_radiation_sum[0].toFixed(1)),evapotranspiration:Number((data.daily.et0_fao_evapotranspiration[0]*precipitationFactor).toFixed(1)),isDay:data.current.is_day===1,temperatureUnit:settings.unitSystem==='IMPERIAL'?'°F':'°C',
		airQuality:aq?{europeanAqi:Math.round(aq.european_aqi),usAqi:Math.round(aq.us_aqi),pm10:Number(aq.pm10.toFixed(1)),pm25:Number(aq.pm2_5.toFixed(1)),carbonMonoxide:Math.round(aq.carbon_monoxide),nitrogenDioxide:Number(aq.nitrogen_dioxide.toFixed(1)),sulphurDioxide:Number(aq.sulphur_dioxide.toFixed(1)),ozone:Number(aq.ozone.toFixed(1))}:null,
		windUnit:settings.unitSystem === 'IMPERIAL' ? 'mph' : 'м/с', labels:uiLabels[settings.language], forecast,hourly,daily,
		layout,
		display:buildDisplay(settings.screenWidth??layout.screenWidth??DEFAULT_SCREEN_WIDTH,settings.screenHeight??layout.screenHeight??DEFAULT_SCREEN_HEIGHT,settings.colorMode??layout.colorMode??DEFAULT_COLOR_MODE),
		sensor:null,
	}
}
