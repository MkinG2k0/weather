export const COLOR_MODE_IDS = ['bw', 'bwr', 'bwy', 'spectra4', 'spectra6', 'rgb'] as const
export type ColorModeId = (typeof COLOR_MODE_IDS)[number]

export const COLOR_MODES: Record<ColorModeId, {label: string; colors: number; palette: string[]}> = {
	bw: {label: '2 цвета · чёрный / белый', colors: 2, palette: ['#000000', '#ffffff']},
	bwr: {label: '3 цвета · ч/б / красный', colors: 3, palette: ['#000000', '#ffffff', '#c00000']},
	bwy: {label: '3 цвета · ч/б / жёлтый', colors: 3, palette: ['#000000', '#ffffff', '#f2c200']},
	spectra4: {label: '4 цвета · Spectra', colors: 4, palette: ['#000000', '#ffffff', '#c00000', '#f2c200']},
	spectra6: {label: '6 цветов · Spectra 6', colors: 6, palette: ['#000000', '#ffffff', '#c00000', '#f2c200', '#1d4ed8', '#15803d']},
	rgb: {label: 'RGB · полноцвет', colors: 0, palette: []},
}

export const SIZE_PRESETS = [
	{id: '800x480', width: 800, height: 480, label: '7.5″ 800×480 · ландшафт'},
	{id: '480x800', width: 480, height: 800, label: '7.5″ 480×800 · портрет (повёрнутая панель)'},
	{id: '640x384', width: 640, height: 384, label: '7.5″ 640×384'},
	{id: '800x600', width: 800, height: 600, label: '6″ 800×600'},
	{id: '400x300', width: 400, height: 300, label: '4.2″ 400×300'},
	{id: '960x640', width: 960, height: 640, label: '7.3″ 960×640'},
	{id: '1024x758', width: 1024, height: 758, label: '10.3″ 1024×758'},
	{id: 'custom', width: 0, height: 0, label: 'Своё разрешение'},
] as const

export const MIN_SCREEN = 200
export const MAX_SCREEN = 2048
export const DESIGN_WIDTH = 800
export const DESIGN_HEIGHT = 480

export type PanelDisplay = {
	width: number
	height: number
	colorMode: ColorModeId
	ink: string
	paper: string
	accent: string
	headerBg: string
	headerFg: string
	fill: string
	sky: string
	ground: string
}

export const DEFAULT_SCREEN_WIDTH = 800
export const DEFAULT_SCREEN_HEIGHT = 480
export const DEFAULT_COLOR_MODE: ColorModeId = 'bw'

function even(value: number) {
	return Math.round(value / 2) * 2
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

export function isColorMode(value: unknown): value is ColorModeId {
	return typeof value === 'string' && COLOR_MODE_IDS.includes(value as ColorModeId)
}

export function normalizeDisplay(width: unknown, height: unknown, colorMode: unknown) {
	const w = Number.isFinite(Number(width)) ? Number(width) : DEFAULT_SCREEN_WIDTH
	const h = Number.isFinite(Number(height)) ? Number(height) : DEFAULT_SCREEN_HEIGHT
	return {
		width: even(clamp(w, MIN_SCREEN, MAX_SCREEN)),
		height: even(clamp(h, MIN_SCREEN, MAX_SCREEN)),
		colorMode: isColorMode(colorMode) ? colorMode : DEFAULT_COLOR_MODE,
	}
}

function themeFor(mode: ColorModeId) {
	if (mode === 'bwr') return {ink: '#000000', paper: '#ffffff', accent: '#c00000', headerBg: '#000000', headerFg: '#ffffff', fill: '#c00000', sky: '#ffffff', ground: '#000000'}
	if (mode === 'bwy') return {ink: '#000000', paper: '#ffffff', accent: '#f2c200', headerBg: '#000000', headerFg: '#ffffff', fill: '#f2c200', sky: '#ffffff', ground: '#000000'}
	if (mode === 'spectra4') return {ink: '#000000', paper: '#ffffff', accent: '#c00000', headerBg: '#000000', headerFg: '#ffffff', fill: '#c00000', sky: '#f2c200', ground: '#000000'}
	if (mode === 'spectra6') return {ink: '#000000', paper: '#ffffff', accent: '#c00000', headerBg: '#1d4ed8', headerFg: '#ffffff', fill: '#1d4ed8', sky: '#1d4ed8', ground: '#15803d'}
	if (mode === 'rgb') return {ink: '#11130f', paper: '#f6f1e6', accent: '#c45c26', headerBg: '#12355b', headerFg: '#f6f1e6', fill: '#1d4ed8', sky: '#5ba3d9', ground: '#3d6b3a'}
	return {ink: '#000000', paper: '#ffffff', accent: '#000000', headerBg: '#000000', headerFg: '#ffffff', fill: '#000000', sky: '#ffffff', ground: '#000000'}
}

export function buildDisplay(width: unknown, height: unknown, colorMode: unknown): PanelDisplay {
	const size = normalizeDisplay(width, height, colorMode)
	return {...size, ...themeFor(size.colorMode)}
}

export function sizePresetId(width: number, height: number) {
	return SIZE_PRESETS.find(preset => preset.width === width && preset.height === height)?.id ?? 'custom'
}

export function hexToRgb(hex: string): [number, number, number] {
	const value = hex.replace('#', '')
	return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)]
}

export function paletteRgb(mode: ColorModeId) {
	return COLOR_MODES[mode].palette.map(hexToRgb)
}
