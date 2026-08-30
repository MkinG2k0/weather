import {normalizeDisplay, type ColorModeId} from './display'

export const BLOCK_IDS = [
	'current','overview','photo','weatherScene','clock','forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','precipitationChart','windChart',
	'feels','humidity','pressure','precipitation','precipitationDetail','metrics','wind','sun','daylight','clouds',
	'cloudLayers','visibility','dewPoint','uv','radiation','airQuality','sensor',
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
	title?: string
	style: HeaderStyle
	size: HeaderSize
}
export const DEFAULT_HEADER: HeaderConfig = {visible:true,showCity:true,showCoords:true,showDate:true,showTime:true,style:'fill',size:'m'}
export const MIN_FONT_SIZE = 80
export const MAX_FONT_SIZE = 150
export const DEFAULT_FONT_SIZE = 115

export function normalizeFontSize(value:unknown){
	const n=Number(value)
	if(!Number.isFinite(n))return DEFAULT_FONT_SIZE
	return Math.round(Math.min(MAX_FONT_SIZE,Math.max(MIN_FONT_SIZE,n))/5)*5
}

export type PanelLayout = {blocks:BlockId[];spans:Partial<Record<BlockId,CardSpan>>;rowSpans?:Partial<Record<BlockId,CardRowSpan>>;photoDataUrl?:string;screenWidth?:number;screenHeight?:number;colorMode?:ColorModeId;fontSize?:number;header?:HeaderConfig}

export function normalizeHeader(value:unknown):HeaderConfig|undefined{
	if(!value||typeof value!=='object')return undefined
	const raw=value as Record<string,unknown>
	const header:HeaderConfig={
		visible:raw.visible!==false,
		showCity:raw.showCity!==false,
		showCoords:raw.showCoords!==false,
		showDate:raw.showDate!==false,
		showTime:raw.showTime!==false,
		style:raw.style==='invert'||raw.style==='line'?raw.style:'fill',
		size:raw.size==='s'||raw.size==='l'?raw.size:'m',
	}
	if(typeof raw.title==='string'){
		const title=raw.title.trim().slice(0,48)
		if(title)header.title=title
	}
	return header
}

export function getHeader(layout:PanelLayout):HeaderConfig{
	return {...DEFAULT_HEADER,...layout.header}
}
export function getFontSize(layout:PanelLayout){
	return normalizeFontSize(layout.fontSize)
}
export type GridPlacement = {id:BlockId;col:number;row:number;colSpan:CardSpan;rowSpan:CardRowSpan}
export type GridSlot = {col:number;row:number;colSpan:CardSpan;rowSpan:CardRowSpan}
export const DEFAULT_LAYOUT:PanelLayout={blocks:['current','clock','weatherScene','temperatureChart','precipitationChart'],spans:{weatherScene:2,temperatureChart:2,precipitationChart:2}}

const DEFAULT_CARD_SPANS:Partial<Record<BlockId,CardSpan>>={overview:4,photo:2,weatherScene:2,clock:2,dailyForecast:4,weekStrip:4,weekTiles:4,weekRange:4,temperatureChart:2,precipitationChart:2,windChart:2,precipitationDetail:2,daylight:2,cloudLayers:2,radiation:2,airQuality:2,sensor:2}
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
	const source=value as {blocks?:unknown;order?:unknown;hidden?:unknown;showForecast?:unknown;spans?:unknown;rowSpans?:unknown;photoDataUrl?:unknown;screenWidth?:unknown;screenHeight?:unknown;colorMode?:unknown;fontSize?:unknown;header?:unknown}
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
	const photoDataUrl=typeof source.photoDataUrl==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(source.photoDataUrl)&&source.photoDataUrl.length<=1_500_000?source.photoDataUrl:undefined
	const display=normalizeDisplay(source.screenWidth,source.screenHeight,source.colorMode)
	const header=normalizeHeader(source.header)
	const fontSize=normalizeFontSize(source.fontSize)
	const extras={...(Object.keys(rowSpans).length?{rowSpans}:{}),...(photoDataUrl?{photoDataUrl}:{}),fontSize,...(header?{header}:{})}
	const layout:PanelLayout={blocks:normalizedBlocks,spans,...extras,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode}
	return layoutFits(layout)?layout:{blocks:normalizedBlocks,spans:{},...extras,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode}
}
