import {normalizeDisplay, type ColorModeId} from './display'
import {DEFAULT_SENSOR_CHART_FILTER, DEFAULT_SENSOR_CHART_RANGE, parseSensorChartFilter, parseSensorChartRange, type SensorChartFilterId, type SensorChartRangeId} from './sensor-log'

export const BLOCK_IDS = [
	'current','overview','photo','weatherScene','clock','forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','precipitationChart','windChart',
	'feels','humidity','pressure','precipitation','precipitationDetail','metrics','wind','sun','daylight','clouds',
	'cloudLayers','visibility','dewPoint','uv','radiation','airQuality','sensor','sensorChart',
] as const
export type BlockId = (typeof BLOCK_IDS)[number]
export type LanguageCode = 'RU'|'EN'
export type UnitSystemCode = 'METRIC'|'IMPERIAL'

export const MAX_BLOCKS = 8
export const GRID_COLS = 4
export const GRID_ROWS = 2
export const CARD_SPANS = [1,2,3,4] as const
export const CARD_ROW_SPANS = [1,2] as const
export type CardSpan = (typeof CARD_SPANS)[number]
export type CardRowSpan = (typeof CARD_ROW_SPANS)[number]
export const HEADER_STYLES = ['fill', 'invert', 'line'] as const
export type HeaderStyle = (typeof HEADER_STYLES)[number]
export const HEADER_SIZES = ['s', 'm', 'l'] as const
export type HeaderSize = (typeof HEADER_SIZES)[number]
export type HeaderConfig = {
	visible: boolean
	showCity: boolean
	showCoords: boolean
	showDate: boolean
	showTime: boolean
	showBattery: boolean
	title?: string
	style: HeaderStyle
	size: HeaderSize
}
export const DEFAULT_HEADER: HeaderConfig = {visible:true,showCity:true,showCoords:true,showDate:true,showTime:true,showBattery:true,style:'fill',size:'m'}
export type SensorConfig = {pressure:boolean;altitude:boolean;humidity:boolean}
export const DEFAULT_SENSOR: SensorConfig = {pressure:true,altitude:true,humidity:true}
export const MIN_FONT_SIZE = 80
export const MAX_FONT_SIZE = 200
export const DEFAULT_FONT_SIZE = 115
export const MIN_CORNER_RADIUS = 0
export const MAX_CORNER_RADIUS = 32
export const DEFAULT_CORNER_RADIUS = 0
export const SCREEN_THEME_IDS = ['classic','night','poster','air','rail'] as const
export type ScreenThemeId = (typeof SCREEN_THEME_IDS)[number]
export const DEFAULT_SCREEN_THEME: ScreenThemeId = 'classic'
export const SCREEN_THEMES: Record<ScreenThemeId,{label:string}> = {
	classic:{label:'Классика · рамки'},
	night:{label:'Ночь · инверсия'},
	poster:{label:'Плакат · заливка'},
	air:{label:'Воздух · тонкие линии'},
	rail:{label:'Рейка · акцент слева'},
}

export function normalizeFontSize(value:unknown){
	const n=Number(value)
	if(!Number.isFinite(n))return DEFAULT_FONT_SIZE
	return Math.round(Math.min(MAX_FONT_SIZE,Math.max(MIN_FONT_SIZE,n))/5)*5
}

export function isScreenTheme(value:unknown):value is ScreenThemeId{
	return typeof value==='string'&&(SCREEN_THEME_IDS as readonly string[]).includes(value)
}

export function normalizeScreenTheme(value:unknown):ScreenThemeId{
	return isScreenTheme(value)?value:DEFAULT_SCREEN_THEME
}

export function normalizeCornerRadius(value:unknown){
	const n=Number(value)
	if(!Number.isFinite(n))return DEFAULT_CORNER_RADIUS
	return Math.round(Math.min(MAX_CORNER_RADIUS,Math.max(MIN_CORNER_RADIUS,n))/2)*2
}

export const MIN_CARD_GAP = 0
export const MAX_CARD_GAP = 28
export const DEFAULT_CARD_GAP = 10
export const DEFAULT_SHOW_BORDER = true
export const DEFAULT_SHOW_FRAME = true
export const DEFAULT_CACHE_SCREEN = true

export function normalizeCardGap(value:unknown){
	const n=Number(value)
	if(!Number.isFinite(n))return DEFAULT_CARD_GAP
	return Math.round(Math.min(MAX_CARD_GAP,Math.max(MIN_CARD_GAP,n)))
}

export function normalizeShowBorder(value:unknown){
	return value!==false
}

export function normalizeShowFrame(value:unknown){
	return value!==false
}

export function normalizeCacheScreen(value:unknown){
	return value!==false
}

export type QuietHours={enabled:boolean;startHour:number;endHour:number;refreshMinutes:number}
export const DEFAULT_QUIET_HOURS:QuietHours={enabled:true,startHour:23,endHour:6,refreshMinutes:60}

function clampHour(value:unknown,fallback:number){
	const n=Number(value)
	if(!Number.isFinite(n))return fallback
	const hour=Math.trunc(n)
	return hour>=0&&hour<=23?hour:fallback
}

function clampRefreshMinutes(value:unknown,fallback:number){
	const n=Number(value)
	if(!Number.isFinite(n))return fallback
	return Math.min(1440,Math.max(1,Math.trunc(n)))
}

export function normalizeQuietHours(value:unknown):QuietHours{
	const source=value&&typeof value==='object'?value as Record<string,unknown>:{}
	return {
		enabled:source.enabled!==false,
		startHour:clampHour(source.startHour,DEFAULT_QUIET_HOURS.startHour),
		endHour:clampHour(source.endHour,DEFAULT_QUIET_HOURS.endHour),
		refreshMinutes:clampRefreshMinutes(source.refreshMinutes,DEFAULT_QUIET_HOURS.refreshMinutes),
	}
}

export function inQuietHours(hour:number,quiet:QuietHours){
	if(!quiet.enabled)return false
	const {startHour,endHour}=quiet
	if(startHour===endHour)return false
	if(startHour<endHour)return hour>=startHour&&hour<endHour
	return hour>=startHour||hour<endHour
}

export function localHourInTimezone(timezone:string,at=new Date()){
	const hour=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hour12:false}).format(at)
	return Number.parseInt(hour,10)%24
}

export function nextRefreshSeconds(refreshMinutes:number,timezone:string,quiet:QuietHours,at=new Date()){
	const regularSeconds=clampRefreshMinutes(refreshMinutes,10)*60
	if(!inQuietHours(localHourInTimezone(timezone,at),quiet))return regularSeconds
	return quiet.refreshMinutes*60
}

export const TIME_RANGES = ['day','days3','week','weeks2','month'] as const
export type TimeRangeId = (typeof TIME_RANGES)[number]
export const TIME_RANGE_DAYS: Record<TimeRangeId, number> = {day:1, days3:3, week:7, weeks2:14, month:16}
export const RANGE_BLOCK_IDS = ['forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','precipitationChart','windChart'] as const
export type RangeBlockId = (typeof RANGE_BLOCK_IDS)[number]
export function isRangeBlock(id:BlockId):id is RangeBlockId {
	return (RANGE_BLOCK_IDS as readonly string[]).includes(id)
}
export const DEFAULT_CARD_RANGE: Record<RangeBlockId, TimeRangeId> = {
	forecast:'day', dailyForecast:'week', weekStrip:'week', weekTiles:'week', weekRange:'week',
	temperatureChart:'day', precipitationChart:'day', windChart:'day',
}

export type PanelLayout = {blocks:BlockId[];spans:Partial<Record<BlockId,CardSpan>>;rowSpans?:Partial<Record<BlockId,CardRowSpan>>;ranges?:Partial<Record<BlockId,TimeRangeId>>;sensorChartRange?:SensorChartRangeId;sensorChartFilter?:SensorChartFilterId;photoDataUrl?:string;screenWidth?:number;screenHeight?:number;colorMode?:ColorModeId;fontSize?:number;theme?:ScreenThemeId;cornerRadius?:number;cardGap?:number;showBorder?:boolean;showFrame?:boolean;cacheScreen?:boolean;quietHours?:QuietHours;header?:HeaderConfig;sensor?:SensorConfig}

export function getSensorChartRange(layout:PanelLayout):SensorChartRangeId{
	return parseSensorChartRange(layout.sensorChartRange)
}

export function withSensorChartRange(layout:PanelLayout,range:SensorChartRangeId):PanelLayout{
	if(range===DEFAULT_SENSOR_CHART_RANGE){
		const next={...layout}
		delete next.sensorChartRange
		return next
	}
	return {...layout,sensorChartRange:range}
}

export function getSensorChartFilter(layout:PanelLayout):SensorChartFilterId{
	return parseSensorChartFilter(layout.sensorChartFilter)
}

export function withSensorChartFilter(layout:PanelLayout,filter:SensorChartFilterId):PanelLayout{
	if(filter===DEFAULT_SENSOR_CHART_FILTER){
		const next={...layout}
		delete next.sensorChartFilter
		return next
	}
	return {...layout,sensorChartFilter:filter}
}

export function getCardRange(layout:PanelLayout,id:BlockId):TimeRangeId {
	if(!isRangeBlock(id))return 'day'
	const value=layout.ranges?.[id]
	return value&&TIME_RANGES.includes(value)?value:DEFAULT_CARD_RANGE[id]
}
export function getCardRangeDays(layout:PanelLayout,id:BlockId){
	return TIME_RANGE_DAYS[getCardRange(layout,id)]
}
export function withCardRange(layout:PanelLayout,id:BlockId,range:TimeRangeId):PanelLayout {
	if(!isRangeBlock(id))return layout
	const ranges={...layout.ranges}
	if(range===DEFAULT_CARD_RANGE[id])delete ranges[id]
	else ranges[id]=range
	return {...layout,ranges:Object.keys(ranges).length?ranges:undefined}
}

export function normalizeHeader(value:unknown):HeaderConfig|undefined{
	if(!value||typeof value!=='object')return undefined
	const raw=value as Record<string,unknown>
	const header:HeaderConfig={
		visible:raw.visible!==false,
		showCity:raw.showCity!==false,
		showCoords:raw.showCoords!==false,
		showDate:raw.showDate!==false,
		showTime:raw.showTime!==false,
		showBattery:raw.showBattery!==false,
		style:raw.style==='invert'||raw.style==='line'?raw.style:'fill',
		size:raw.size==='s'||raw.size==='l'?raw.size:'m',
	}
	if(typeof raw.title==='string'){
		const title=raw.title.trim().slice(0,48)
		if(title)header.title=title
	}
	return header
}

export function normalizeSensor(value:unknown):SensorConfig{
	if(!value||typeof value!=='object')return {...DEFAULT_SENSOR}
	const raw=value as Record<string,unknown>
	return {
		pressure:raw.pressure!==false,
		altitude:raw.altitude!==false,
		humidity:raw.humidity!==false,
	}
}

export function getSensor(layout:PanelLayout):SensorConfig{
	return {...DEFAULT_SENSOR,...layout.sensor}
}

export function getHeader(layout:PanelLayout):HeaderConfig{
	return {...DEFAULT_HEADER,...layout.header}
}
export function getFontSize(layout:PanelLayout){
	return normalizeFontSize(layout.fontSize)
}
export function getScreenTheme(layout:PanelLayout){
	return normalizeScreenTheme(layout.theme)
}
export function getCornerRadius(layout:PanelLayout){
	return normalizeCornerRadius(layout.cornerRadius)
}
export function getCardGap(layout:PanelLayout){
	return normalizeCardGap(layout.cardGap)
}
export function getShowBorder(layout:PanelLayout){
	return normalizeShowBorder(layout.showBorder)
}
export function getShowFrame(layout:PanelLayout){
	return normalizeShowFrame(layout.showFrame)
}
export function getCacheScreen(layout:PanelLayout){
	return normalizeCacheScreen(layout.cacheScreen)
}
export function getQuietHours(layout:PanelLayout){
	return normalizeQuietHours(layout.quietHours)
}
export type GridPlacement = {id:BlockId;col:number;row:number;colSpan:CardSpan;rowSpan:CardRowSpan}
export type GridSlot = {col:number;row:number;colSpan:CardSpan;rowSpan:CardRowSpan}
export const DEFAULT_LAYOUT:PanelLayout={blocks:['current','clock','weatherScene','temperatureChart','precipitationChart'],spans:{weatherScene:2,temperatureChart:2,precipitationChart:2}}

const DEFAULT_CARD_SPANS:Partial<Record<BlockId,CardSpan>>={overview:4,photo:2,weatherScene:2,clock:2,dailyForecast:4,weekStrip:4,weekTiles:4,weekRange:4,temperatureChart:2,precipitationChart:2,windChart:2,precipitationDetail:2,daylight:2,cloudLayers:2,radiation:2,airQuality:2,sensor:2,sensorChart:2}
export function getDefaultCardSpan(id:BlockId):CardSpan{return DEFAULT_CARD_SPANS[id]??1}

export function getCardSpan(layout:PanelLayout,id:BlockId):CardSpan{return layout.spans?.[id]??1}
export function getCardRowSpan(layout:PanelLayout,id:BlockId):CardRowSpan{return layout.rowSpans?.[id]??1}

function cellFree(occ:boolean[][],col:number,row:number,colSpan:number,rowSpan:number){
	if(col+colSpan>GRID_COLS||row+rowSpan>GRID_ROWS)return false
	for(let r=row;r<row+rowSpan;r++)for(let c=col;c<col+colSpan;c++)if(occ[r][c])return false
	return true
}

function occupy(occ:boolean[][],col:number,row:number,colSpan:number,rowSpan:number){
	for(let r=row;r<row+rowSpan;r++)for(let c=col;c<col+colSpan;c++)occ[r][c]=true
}

export function packBlockGrid(layout:PanelLayout):GridPlacement[]|null{
	const occ=Array.from({length:GRID_ROWS},()=>Array(GRID_COLS).fill(false))
	const placements:GridPlacement[]=[]
	for(const id of layout.blocks){
		const colSpan=getCardSpan(layout,id)
		const rowSpan=getCardRowSpan(layout,id)
		let placed:GridPlacement|undefined
		for(let row=0;row<=GRID_ROWS-rowSpan&&!placed;row++){
			for(let col=0;col<=GRID_COLS-colSpan;col++){
				if(!cellFree(occ,col,row,colSpan,rowSpan))continue
				occupy(occ,col,row,colSpan,rowSpan)
				placed={id,col:col+1,row:row+1,colSpan,rowSpan}
				break
			}
		}
		if(!placed)return null
		placements.push(placed)
	}
	return placements
}

export function findEmptySlot(layout:PanelLayout):GridSlot|null{
	const packed=packBlockGrid(layout)
	if(!packed)return null
	const occ=Array.from({length:GRID_ROWS},()=>Array(GRID_COLS).fill(false))
	for(const item of packed)occupy(occ,item.col-1,item.row-1,item.colSpan,item.rowSpan)
	for(let row=0;row<GRID_ROWS;row++){
		for(let col=0;col<GRID_COLS;col++){
			if(occ[row][col])continue
			let width=1
			while(col+width<GRID_COLS&&!occ[row][col+width])width++
			return {col:col+1,row:row+1,colSpan:width as CardSpan,rowSpan:1}
		}
	}
	return null
}

export function layoutFits(layout:PanelLayout){return packBlockGrid(layout)!==null}

export function withCardSize(layout:PanelLayout,id:BlockId,size:{span?:CardSpan;rowSpan?:CardRowSpan}):PanelLayout{
	const spans={...layout.spans}
	const rowSpans={...layout.rowSpans}
	if(size.span!==undefined){if(size.span===1)delete spans[id];else spans[id]=size.span}
	if(size.rowSpan!==undefined){if(size.rowSpan===1)delete rowSpans[id];else rowSpans[id]=size.rowSpan}
	return {...layout,spans,rowSpans:Object.keys(rowSpans).length?rowSpans:undefined}
}

export type EditablePanel={
	id:string;name:string;slug:string;cityName:string;latitude:number;longitude:number;timezone:string
	language:LanguageCode;unitSystem:UnitSystemCode;refreshMinutes:number
	screenWidth:number;screenHeight:number;colorMode:ColorModeId
	layout:PanelLayout;updatedAt:string
}

export function normalizeLayout(value:unknown):PanelLayout{
	if(!value||typeof value!=='object')return DEFAULT_LAYOUT
	const source=value as {blocks?:unknown;order?:unknown;hidden?:unknown;showForecast?:unknown;spans?:unknown;rowSpans?:unknown;ranges?:unknown;sensorChartRange?:unknown;sensorChartFilter?:unknown;photoDataUrl?:unknown;screenWidth?:unknown;screenHeight?:unknown;colorMode?:unknown;fontSize?:unknown;theme?:unknown;cornerRadius?:unknown;cardGap?:unknown;showBorder?:unknown;showFrame?:unknown;cacheScreen?:unknown;quietHours?:unknown;header?:unknown;sensor?:unknown}
	let candidates:unknown[]=Array.isArray(source.blocks)?source.blocks:[]
	// Convert layouts stored by the first editor version.
	if(!candidates.length&&Array.isArray(source.order)){
		const hidden=new Set(Array.isArray(source.hidden)?source.hidden:[])
		candidates=source.order.filter(id=>!hidden.has(id))
	}
	const blocks=[...new Set(candidates.filter((id):id is BlockId=>BLOCK_IDS.includes(id as BlockId)))]
	// Forecast used to be a special footer. Promote it to a regular card when
	// loading old saved layouts, so no database migration is required.
	if(source.showForecast===true&&!blocks.includes('forecast'))blocks.push('forecast')
	const normalizedBlocks=(blocks.length?blocks:DEFAULT_LAYOUT.blocks).slice(0,MAX_BLOCKS)
	const rawSpans=source.spans&&typeof source.spans==='object'?source.spans as Record<string,unknown>:{}
	const rawRowSpans=source.rowSpans&&typeof source.rowSpans==='object'?source.rowSpans as Record<string,unknown>:{}
	const spans:Partial<Record<BlockId,CardSpan>>={}
	const rowSpans:Partial<Record<BlockId,CardRowSpan>>={}
	for(const id of normalizedBlocks){
		const span=rawSpans[id]
		if(CARD_SPANS.includes(span as CardSpan)&&span!==1)spans[id]=span as CardSpan
		const rowSpan=rawRowSpans[id]
		if(CARD_ROW_SPANS.includes(rowSpan as CardRowSpan)&&rowSpan!==1)rowSpans[id]=rowSpan as CardRowSpan
	}
	const rawRanges=source.ranges&&typeof source.ranges==='object'?source.ranges as Record<string,unknown>:{}
	const ranges:Partial<Record<BlockId,TimeRangeId>>={}
	for(const id of normalizedBlocks){
		if(!isRangeBlock(id))continue
		const range=rawRanges[id]
		if(TIME_RANGES.includes(range as TimeRangeId)&&range!==DEFAULT_CARD_RANGE[id])ranges[id]=range as TimeRangeId
	}
	const photoDataUrl=typeof source.photoDataUrl==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(source.photoDataUrl)&&source.photoDataUrl.length<=1_500_000?source.photoDataUrl:undefined
	const display=normalizeDisplay(source.screenWidth,source.screenHeight,source.colorMode)
	const header=normalizeHeader(source.header)
	const sensor=normalizeSensor(source.sensor)
	const fontSize=normalizeFontSize(source.fontSize)
	const theme=normalizeScreenTheme(source.theme)
	const cornerRadius=normalizeCornerRadius(source.cornerRadius)
	const cardGap=normalizeCardGap(source.cardGap)
	const showBorder=normalizeShowBorder(source.showBorder)
	const showFrame=normalizeShowFrame(source.showFrame)
	const cacheScreen=normalizeCacheScreen(source.cacheScreen)
	const quietHours=normalizeQuietHours(source.quietHours)
	const parsedRange=parseSensorChartRange(source.sensorChartRange)
	const sensorChartRange=parsedRange!==DEFAULT_SENSOR_CHART_RANGE?parsedRange:undefined
	const parsedFilter=parseSensorChartFilter(source.sensorChartFilter)
	const sensorChartFilter=parsedFilter!==DEFAULT_SENSOR_CHART_FILTER?parsedFilter:undefined
	const extras={...(Object.keys(rowSpans).length?{rowSpans}:{}),...(Object.keys(ranges).length?{ranges}:{}),...(sensorChartRange?{sensorChartRange}:{}),...(sensorChartFilter?{sensorChartFilter}:{}),...(photoDataUrl?{photoDataUrl}:{}),fontSize,theme,cornerRadius,cardGap,showBorder,showFrame,cacheScreen,quietHours,sensor,...(header?{header}:{})}
	const layout:PanelLayout={blocks:normalizedBlocks,spans,...extras,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode}
	return layoutFits(layout)?layout:{blocks:normalizedBlocks,spans:{},...extras,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode}
}
