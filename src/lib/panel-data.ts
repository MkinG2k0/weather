import type {WeatherPanel} from '@/generated/prisma/client'
import {normalizeLayout, type EditablePanel} from './panel-config'

export function serializePanel(panel: WeatherPanel): EditablePanel {
	const layout = normalizeLayout(panel.layout)
	return {
		id: panel.id,
		name: panel.name,
		slug: panel.slug,
		cityName: panel.cityName,
		latitude: panel.latitude,
		longitude: panel.longitude,
		timezone: panel.timezone,
		language: panel.language,
		unitSystem: panel.unitSystem,
		refreshMinutes: panel.refreshMinutes,
		screenWidth: layout.screenWidth ?? 800,
		screenHeight: layout.screenHeight ?? 480,
		colorMode: layout.colorMode ?? 'bw',
		layout,
		updatedAt: panel.updatedAt.toISOString(),
	}
}
