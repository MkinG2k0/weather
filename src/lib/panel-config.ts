export const BLOCK_IDS = ['current','metrics','wind','sun','clouds'] as const
export type BlockId = (typeof BLOCK_IDS)[number]
export type LanguageCode = 'RU'|'EN'
export type UnitSystemCode = 'METRIC'|'IMPERIAL'

export type PanelLayout = {blocks:BlockId[];showForecast:boolean}
export const DEFAULT_LAYOUT:PanelLayout={blocks:['current','metrics','wind'],showForecast:true}

export type EditablePanel={
	id:string;name:string;slug:string;cityName:string;latitude:number;longitude:number;timezone:string
	language:LanguageCode;unitSystem:UnitSystemCode;refreshMinutes:number;layout:PanelLayout;updatedAt:string
}

export function normalizeLayout(value:unknown):PanelLayout{
	if(!value||typeof value!=='object')return DEFAULT_LAYOUT
	const source=value as {blocks?:unknown;order?:unknown;hidden?:unknown;showForecast?:unknown}
	let candidates:unknown[]=Array.isArray(source.blocks)?source.blocks:[]
	// Convert layouts stored by the first editor version.
	if(!candidates.length&&Array.isArray(source.order)){
		const hidden=new Set(Array.isArray(source.hidden)?source.hidden:[])
		candidates=source.order.filter(id=>!hidden.has(id))
	}
	const blocks=[...new Set(candidates.filter((id):id is BlockId=>BLOCK_IDS.includes(id as BlockId)))].slice(0,3)
	return {blocks:blocks.length?blocks:DEFAULT_LAYOUT.blocks,showForecast:source.showForecast!==false}
}
