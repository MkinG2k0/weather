import type {UnitSystemCode} from './panel-config'

export type DeviceSensorReading = {
	chip: 'BMP280' | 'BME280'
	temperature: string
	pressure: string
	altitude: string
	humidity: string | null
	hasHumidity: boolean
}

const TEMP_MIN = -40
const TEMP_MAX = 85
const PRESSURE_MIN = 300
const PRESSURE_MAX = 1100
const ALTITUDE_MIN = -500
const ALTITUDE_MAX = 9000

function readNumber(params: URLSearchParams, key: string) {
	const raw = params.get(key)
	if (raw === null || raw === '') return Number.NaN
	return Number(raw)
}

function inRange(value: number, min: number, max: number) {
	return Number.isFinite(value) && value >= min && value <= max
}

function formatTemperature(celsius: number, units: UnitSystemCode) {
	const value = units === 'IMPERIAL' ? celsius * 9 / 5 + 32 : celsius
	return `${value.toFixed(1)}°`
}

function formatPressure(hpa: number, units: UnitSystemCode) {
	return units === 'IMPERIAL'
		? `${(hpa * 0.029529983).toFixed(2)} inHg`
		: `${Math.round(hpa * 0.750061683)} мм`
}

function formatAltitude(meters: number, units: UnitSystemCode) {
	return units === 'IMPERIAL'
		? `${Math.round(meters * 3.28084)} ft`
		: `${Math.round(meters)} м`
}

export function parseDeviceSensor(requestUrl: string, unitSystem: UnitSystemCode): DeviceSensorReading | null {
	const params = new URL(requestUrl).searchParams
	const tempC = readNumber(params, 'temp_c')
	const pressureHpa = readNumber(params, 'pressure_hpa')
	const altitudeM = readNumber(params, 'altitude_m')
	if (!inRange(tempC, TEMP_MIN, TEMP_MAX) || !inRange(pressureHpa, PRESSURE_MIN, PRESSURE_MAX) || !inRange(altitudeM, ALTITUDE_MIN, ALTITUDE_MAX)) {
		return null
	}

	const chipRaw = (params.get('chip') ?? 'bmp280').toLowerCase()
	const chip = chipRaw === 'bme280' ? 'BME280' : 'BMP280'
	const humidity = readNumber(params, 'humidity')
	const hasHumidity = chip === 'BME280' && inRange(humidity, 0, 100)

	return {
		chip,
		temperature: formatTemperature(tempC, unitSystem),
		pressure: formatPressure(pressureHpa, unitSystem),
		altitude: formatAltitude(altitudeM, unitSystem),
		humidity: hasHumidity ? `${humidity.toFixed(1)}%` : null,
		hasHumidity,
	}
}

export function demoDeviceSensor(unitSystem: UnitSystemCode): DeviceSensorReading {
	const reading = parseDeviceSensor(
		'https://preview.local/screen.png?chip=bme280&temp_c=22.4&pressure_hpa=1013.25&altitude_m=12&humidity=48',
		unitSystem,
	)
	if (!reading) throw new Error('Demo sensor reading is invalid')
	return reading
}

export function parseDeviceBatteryPercent(requestUrl: string): number | null {
	const percent = readNumber(new URL(requestUrl).searchParams, 'batt_pct')
	if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null
	return Math.round(percent)
}

export function demoDeviceBatteryPercent() {
	return 76
}
