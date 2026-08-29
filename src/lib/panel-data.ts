import type {WeatherPanel} from '@/generated/prisma/client'
import {normalizeLayout, type EditablePanel} from './panel-config'

export function serializePanel(panel: WeatherPanel): EditablePanel {
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
		layout: normalizeLayout(panel.layout),
		updatedAt: panel.updatedAt.toISOString(),
	}
}
