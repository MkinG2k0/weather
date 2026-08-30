'use client'

import {useEffect,useLayoutEffect,useMemo,useRef,useState,type MouseEvent,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {useRouter} from 'next/navigation'
import {closestCorners,DndContext,KeyboardSensor,PointerSensor,useDndContext,useDndMonitor,useSensor,useSensors,type DragEndEvent,type DragStartEvent} from '@dnd-kit/core'
import {arrayMove,sortableKeyboardCoordinates,SortableContext,useSortable,type SortingStrategy} from '@dnd-kit/sortable'
import {WeatherScreen,renderPanelCard} from '@/components/weather-screen'
import {buildDisplay,COLOR_MODES,COLOR_MODE_IDS,MIN_SCREEN,MAX_SCREEN,sizePresetId,SIZE_PRESETS,type ColorModeId} from '@/lib/display'
import {BLOCK_IDS,CARD_ROW_SPANS,CARD_SPANS,DEFAULT_HEADER,MAX_BLOCKS,MAX_CARD_GAP,MAX_CORNER_RADIUS,MAX_FONT_SIZE,MIN_CARD_GAP,MIN_CORNER_RADIUS,MIN_FONT_SIZE,SCREEN_THEME_IDS,SCREEN_THEMES,findEmptySlot,getCacheScreen,getCardGap,getCardRange,getCardRowSpan,getCardSpan,getCornerRadius,getDefaultCardSpan,getFontSize,getHeader,getQuietHours,getScreenTheme,getSensor,getSensorChartFilter,getSensorChartRange,getShowBorder,getShowFrame,isRangeBlock,layoutFits,normalizeCardGap,normalizeCornerRadius,normalizeFontSize,normalizeScreenTheme,packBlockGrid,withCardRange,withCardSize,withSensorChartFilter,withSensorChartRange,type BlockId,type CardRowSpan,type CardSpan,type EditablePanel,type HeaderConfig,type HeaderSize,type HeaderStyle,type QuietHours,type ScreenThemeId,type SensorConfig,type TimeRangeId} from '@/lib/panel-config'
import {type SensorChartFilterId, type SensorChartRangeId} from '@/lib/sensor-log'
import type {WeatherScreenData} from '@/lib/weather'

type City={id:number|string;name:string;label:string;region:string;country:string;latitude:number;longitude:number;timezone:string}
const blockNames:Record<BlockId,string>={current:'Температура',overview:'Полная сводка',photo:'Фото',weatherScene:'Фото / погодная сцена',clock:'Часы · циферблат',forecast:'Почасовой прогноз',dailyForecast:'Прогноз по дням',weekStrip:'Дни · иконки',weekTiles:'Дни · плитки',weekRange:'Дни · диапазон',temperatureChart:'График температуры',precipitationChart:'График осадков',windChart:'График ветра',feels:'Ощущается',humidity:'Влажность',pressure:'Давление',precipitation:'Вероятность осадков',precipitationDetail:'Состав осадков',metrics:'Главные показатели',wind:'Ветер',sun:'Восход · закат · УФ',daylight:'Световой день',clouds:'Облачность',cloudLayers:'Слои облаков',visibility:'Видимость',dewPoint:'Точка росы',uv:'УФ-индекс',radiation:'Солнечная энергия',airQuality:'Качество воздуха',sensor:'Датчик',sensorChart:'График температуры датчика'}
const rangePips:{id:TimeRangeId;label:string}[]=[{id:'day',label:'День'},{id:'days3',label:'3 дня'},{id:'week',label:'Нед'},{id:'weeks2',label:'2 нед'},{id:'month',label:'Мес'}]
const sensorRangePips:{id:SensorChartRangeId;label:string}[]=[{id:'hour',label:'1ч'},{id:'hours3',label:'3ч'},{id:'hours6',label:'6ч'},{id:'hours12',label:'12ч'},{id:'hours24',label:'24ч'},{id:'days3',label:'3дн'},{id:'week',label:'Нед'},{id:'month',label:'Мес'}]
const sensorFilterPips:{id:SensorChartFilterId;label:string}[]=[{id:'raw',label:'Как есть'},{id:'spikes',label:'Без выбросов'},{id:'median',label:'Медиана'}]
const blockGroups:{label:string;ids:BlockId[]}[]=[
	{label:'Главное',ids:['current','overview','weatherScene','clock','metrics']},
	{label:'Прогнозы и графики',ids:['forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','sensorChart','precipitationChart','windChart']},
	{label:'Атмосфера',ids:['feels','humidity','pressure','visibility','dewPoint','airQuality']},
	{label:'Осадки, ветер и облака',ids:['precipitation','precipitationDetail','wind','clouds','cloudLayers']},
	{label:'Солнце',ids:['sun','daylight','uv','radiation']},
	{label:'Устройство',ids:['photo','sensor','sensorChart']},
]
const refreshPresets=[1,5,10,15,30,60,180,360,720,1440]
const hourOptions=Array.from({length:24},(_,hour)=>hour)
function hourLabel(hour:number){return `${String(hour).padStart(2,'0')}:00`}
function refreshSelectOptions(){
	return <>
		<option value={1}>1 минута</option>
		<option value={5}>5 минут</option>
		<option value={10}>10 минут</option>
		<option value={15}>15 минут</option>
		<option value={30}>30 минут</option>
		<option value={60}>1 час</option>
		<option value={180}>3 часа</option>
		<option value={360}>6 часов</option>
		<option value={720}>12 часов</option>
		<option value={1440}>1 день</option>
		<option value="custom">Свой интервал</option>
	</>
}
const CELL=182
const GAP=10

function cardBox(span:CardSpan,rowSpan:CardRowSpan){return {width:span*CELL+(span-1)*GAP,height:rowSpan*CELL+(rowSpan-1)*GAP}}

const MAX_PHOTO_DATA_URL=1_400_000
async function fileToPhotoDataUrl(file:File){
	if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('Нужен JPEG, PNG или WebP')
	const bitmap=await createImageBitmap(file)
	const scale=Math.min(1,960/Math.max(bitmap.width,bitmap.height))
	const width=Math.max(1,Math.round(bitmap.width*scale))
	const height=Math.max(1,Math.round(bitmap.height*scale))
	const canvas=document.createElement('canvas')
	canvas.width=width
	canvas.height=height
	const ctx=canvas.getContext('2d')
	if(!ctx)throw new Error('Не удалось обработать фото')
	ctx.imageSmoothingEnabled=true
	ctx.imageSmoothingQuality='high'
	ctx.drawImage(bitmap,0,0,width,height)
	bitmap.close()
	let quality=0.86
	let url=canvas.toDataURL('image/jpeg',quality)
	while(url.length>MAX_PHOTO_DATA_URL&&quality>0.42){
		quality-=0.08
		url=canvas.toDataURL('image/jpeg',quality)
	}
	if(url.length>MAX_PHOTO_DATA_URL)throw new Error('Файл слишком большой. Выберите другое фото.')
	return url
}

function CardThumb({id,weather,span,rowSpan}:{id:BlockId;weather:WeatherScreenData;span:CardSpan;rowSpan:CardRowSpan}){
	const box=cardBox(span,rowSpan)
	const scale=Math.min(156/box.width,(rowSpan===2?128:78)/box.height)
	return <div className="card-thumb" style={{width:box.width*scale,height:box.height*scale}}>
		<div className="card-thumb-stage" style={{width:box.width,height:box.height,transform:`scale(${scale})`}}>
			<div style={{display:'flex',width:box.width,height:box.height}}>{renderPanelCard(id,weather,rowSpan===1,span)}</div>
		</div>
	</div>
}

const stayPutStrategy:SortingStrategy=()=>null

function InlineSortableBlock({id,selected,onSelect,radius,children}:{id:BlockId;selected:boolean;onSelect:()=>void;radius:number;children:ReactNode}){
	const {attributes,listeners,setNodeRef,isDragging,isOver}=useSortable({id,animateLayoutChanges:()=>false})
	return <div ref={setNodeRef} style={{borderRadius:radius}} className={`inline-sortable${isDragging?' is-dragging':''}${isOver&&!isDragging?' is-drop-over':''}${selected?' is-selected':''}`} {...attributes} {...listeners} aria-label={`${blockNames[id]}. Перетащите, чтобы сменить место`} onClick={(event:MouseEvent)=>{event.stopPropagation();onSelect()}}>
		<div className="inline-card-content">{children}</div>
	</div>
}

function LiveCardDrag({weather,previewScale,radius}:{weather:WeatherScreenData;previewScale:number;radius:number}){
	const {active,activeNode,activeNodeRect}=useDndContext()
	const [origin,setOrigin]=useState<{left:number;top:number;width:number;height:number}|null>(null)
	const [delta,setDelta]=useState({x:0,y:0})
	useLayoutEffect(()=>{
		if(!active){setOrigin(null);setDelta({x:0,y:0});return}
		setOrigin(prev=>{
			if(prev)return prev
			const box=activeNode?.getBoundingClientRect()
			if(box&&box.width&&box.height)return {left:box.left,top:box.top,width:box.width,height:box.height}
			if(activeNodeRect)return {left:activeNodeRect.left,top:activeNodeRect.top,width:activeNodeRect.width,height:activeNodeRect.height}
			return prev
		})
	},[active,activeNode,activeNodeRect])
	useDndMonitor({
		onDragMove(event){setDelta({x:event.delta.x,y:event.delta.y})},
		onDragEnd(){setOrigin(null);setDelta({x:0,y:0})},
		onDragCancel(){setOrigin(null);setDelta({x:0,y:0})},
	})
	if(!active||!origin||typeof document==='undefined')return null
	const id=active.id as BlockId
	const packed=packBlockGrid(weather.layout)??[]
	const item=packed.find(entry=>entry.id===id)
	const compact=Math.max(1,...packed.map(entry=>entry.row+entry.rowSpan-1))>1&&(item?.rowSpan??1)===1
	const span=item?.colSpan??1
	const scale=Math.max(previewScale,.12)
	return createPortal(<div className="drag-ghost" style={{left:origin.left+delta.x,top:origin.top+delta.y,width:origin.width,height:origin.height,borderRadius:radius}}>
		<div className="drag-ghost-stage" style={{width:origin.width/scale,height:origin.height/scale,transform:`scale(${scale})`}}>
			<div style={{display:'flex',width:'100%',height:'100%'}}>{renderPanelCard(id,weather,compact,span)}</div>
		</div>
	</div>,document.body)
}

export function PanelEditor({initialPanel,initialWeather,origin,username}:{initialPanel:EditablePanel;initialWeather:WeatherScreenData;origin:string;username:string}){
	const router=useRouter();const [panel,setPanel]=useState(initialPanel);const [weather,setWeather]=useState(initialWeather);const [cityQuery,setCityQuery]=useState(panel.cityName)
	const [cities,setCities]=useState<City[]>([]);const [searching,setSearching]=useState(false);const [searchAttempted,setSearchAttempted]=useState(false);const [locating,setLocating]=useState(false);const [cityError,setCityError]=useState('');const [previewLoading,setPreviewLoading]=useState(false)
	const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);const [previewScale,setPreviewScale]=useState(1);const previewHost=useRef<HTMLDivElement>(null);const previewStage=useRef<HTMLDivElement>(null)
	const [selectedId,setSelectedId]=useState<BlockId|null>(null);const [selectedHeader,setSelectedHeader]=useState(false);const [adding,setAdding]=useState(false)
	const [customSize,setCustomSize]=useState(()=>sizePresetId(initialPanel.screenWidth,initialPanel.screenHeight)==='custom')
	const photoInput=useRef<HTMLInputElement>(null)
	const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}))
	const baseUrl=`${origin}/d/${panel.slug}`;const configUrl=`${baseUrl}/config`;const screenUrl=`${baseUrl}/screen.png?v=${encodeURIComponent(panel.updatedAt)}`

	const inspectorOpen=Boolean(selectedId||adding||selectedHeader)
	useEffect(()=>{
		const stage=previewStage.current
		if(!stage)return
		const resize=()=>{
			const inspectorReserve=inspectorOpen?460:0
			const maxW=Math.max(160,stage.clientWidth-36-inspectorReserve)
			const maxH=Math.max(160,window.innerHeight-220)
			setPreviewScale(Math.min(1,Math.max(.12,Math.min(maxW/panel.screenWidth,maxH/panel.screenHeight))))
		}
		resize()
		const observer=new ResizeObserver(resize)
		observer.observe(stage)
		window.addEventListener('resize',resize)
		return()=>{observer.disconnect();window.removeEventListener('resize',resize)}
	},[panel.screenWidth,panel.screenHeight,inspectorOpen])
	useEffect(()=>{
		if(cityQuery.trim().length<2||cityQuery===panel.cityName)return
		const controller=new AbortController();const timer=setTimeout(async()=>{setSearching(true);setCityError('');try{const response=await fetch(`/api/cities?q=${encodeURIComponent(cityQuery)}`,{signal:controller.signal});const data=await response.json();setCities(response.ok?data.results:[]);setSearchAttempted(true);if(!response.ok)setCityError(data.error??'Не удалось найти город')}catch{if(!controller.signal.aborted){setCities([]);setSearchAttempted(true);setCityError('Поиск временно недоступен')}}finally{if(!controller.signal.aborted)setSearching(false)}},350)
		return()=>{clearTimeout(timer);controller.abort()}
	},[cityQuery,panel.cityName])
	useEffect(()=>{
		const controller=new AbortController();const timer=setTimeout(async()=>{setPreviewLoading(true);try{const response=await fetch('/api/panel/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(panel),signal:controller.signal});if(response.ok)setWeather(await response.json())}catch(error){if(!controller.signal.aborted)console.error('Preview update failed',error)}finally{if(!controller.signal.aborted)setPreviewLoading(false)}},300)
		return()=>{clearTimeout(timer);controller.abort()}
	},[panel])
	useEffect(()=>{if(selectedId&&!panel.layout.blocks.includes(selectedId))setSelectedId(panel.layout.blocks[0]??null)},[panel.layout.blocks,selectedId])

	const unusedBlocks=useMemo(()=>BLOCK_IDS.filter(id=>!panel.layout.blocks.includes(id)),[panel.layout.blocks])
	function onDragStart(event:DragStartEvent){
		const id=event.active.id as BlockId
		setSelectedId(id);setAdding(false);setSelectedHeader(false)
	}
	function onDragEnd(event:DragEndEvent){
		const active=event.active.id as BlockId;const over=event.over?.id as BlockId|undefined;if(!over||active===over)return
		const oldIndex=panel.layout.blocks.indexOf(active);const newIndex=panel.layout.blocks.indexOf(over)
		const layout={...panel.layout,blocks:arrayMove(panel.layout.blocks,oldIndex,newIndex)}
		if(layoutFits(layout))setPanel({...panel,layout});else setMessage('В таком порядке карточки не помещаются в два ряда.')
	}
	function replaceBlock(from:BlockId,to:BlockId){
		if(from===to)return
		const spans={...panel.layout.spans};const span=spans[from];delete spans[from];if(span)spans[to]=span
		const rowSpans={...panel.layout.rowSpans};const rowSpan=rowSpans[from];delete rowSpans[from];if(rowSpan)rowSpans[to]=rowSpan
		const ranges={...panel.layout.ranges};const range=ranges[from];delete ranges[from];if(range&&isRangeBlock(to))ranges[to]=range
		setPanel({...panel,layout:{...panel.layout,blocks:panel.layout.blocks.map(id=>id===from?to:id),spans,rowSpans:Object.keys(rowSpans).length?rowSpans:undefined,ranges:Object.keys(ranges).length?ranges:undefined}})
		setSelectedId(to)
	}
	function resizeBlock(id:BlockId,size:{span?:CardSpan;rowSpan?:CardRowSpan}){const layout=withCardSize(panel.layout,id,size);if(layoutFits(layout)){setPanel({...panel,layout});setMessage('')}else setMessage('Эта ширина или высота не помещается в сетку 4×2.')}
	function removeBlock(id:BlockId){if(panel.layout.blocks.length===1)return;const spans={...panel.layout.spans};delete spans[id];const rowSpans={...panel.layout.rowSpans};delete rowSpans[id];const ranges={...panel.layout.ranges};delete ranges[id];const blocks=panel.layout.blocks.filter(item=>item!==id);setPanel({...panel,layout:{...panel.layout,blocks,spans,rowSpans:Object.keys(rowSpans).length?rowSpans:undefined,ranges:Object.keys(ranges).length?ranges:undefined}});if(selectedId===id)setSelectedId(blocks[0]??null)}
	function layoutWithAdded(id:BlockId){const preferred=getDefaultCardSpan(id);const withPreferred={...panel.layout,blocks:[...panel.layout.blocks,id],spans:{...panel.layout.spans,...(preferred===1?{}:{[id]:preferred})}};if(layoutFits(withPreferred))return withPreferred;const fallback={...panel.layout,blocks:[...panel.layout.blocks,id]};return layoutFits(fallback)?fallback:null}
	function addBlock(id:BlockId){if(panel.layout.blocks.length>=MAX_BLOCKS||panel.layout.blocks.includes(id))return;const layout=layoutWithAdded(id);if(layout){setPanel({...panel,layout});setSelectedId(id);setAdding(false)}else setMessage('На экране не осталось места для этой карточки.')}
	function chooseCity(city:City){setPanel({...panel,cityName:city.name,latitude:city.latitude,longitude:city.longitude,timezone:city.timezone});setCityQuery(city.name);setCities([]);setSearchAttempted(false);setCityError('')}
	async function locateCity(){
		setCityError('');setLocating(true)
		if(!navigator.geolocation){setCityError('Этот браузер не поддерживает геолокацию');setLocating(false);return}
		try{
			const position=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15_000,maximumAge:300_000}))
			const response=await fetch(`/api/cities?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);const data=await response.json()
			if(!response.ok)throw new Error(data.error??'Не удалось определить город')
			chooseCity(data.result)
		}catch(error){const code=(error as GeolocationPositionError).code;setCityError(code===1?'Доступ к геопозиции запрещён в браузере':code===2?'Не удалось определить местоположение':code===3?'Определение местоположения заняло слишком много времени':error instanceof Error?error.message:'Не удалось определить город')}
		finally{setLocating(false)}
	}
	function applyDisplay(next:{screenWidth?:number;screenHeight?:number;colorMode?:ColorModeId}){
		const merged={...panel,...next}
		const display=buildDisplay(merged.screenWidth,merged.screenHeight,merged.colorMode)
		setPanel({...merged,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode,layout:{...panel.layout,screenWidth:display.width,screenHeight:display.height,colorMode:display.colorMode}})
	}
	async function save(){setSaving(true);setMessage('');const response=await fetch('/api/panel',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(panel)});const data=await response.json();if(response.ok){setPanel(data);setCityQuery(data.cityName);setMessage('Настройки сохранены.')}else setMessage(data.error??'Не удалось сохранить');setSaving(false)}
	async function rotate(){if(!confirm('Старая ссылка перестанет работать. Создать новую?'))return;const response=await fetch('/api/panel/rotate',{method:'POST'});const data=await response.json();if(response.ok){setPanel(data);setMessage('Персональная ссылка заменена.')}else setMessage(data.error??'Не удалось заменить ссылку')}
	async function copy(value:string){await navigator.clipboard.writeText(value);setMessage('Ссылка скопирована.')}
	async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.refresh()}
	function selectHeader(){setSelectedHeader(true);setSelectedId(null);setAdding(false)}
	function patchHeader(next:Partial<HeaderConfig>){setPanel({...panel,layout:{...panel.layout,header:{...getHeader(panel.layout),...next}}})}
	function patchQuietHours(next:Partial<QuietHours>){setPanel({...panel,layout:{...panel.layout,quietHours:{...getQuietHours(panel.layout),...next}}})}
	function patchSensor(next:Partial<SensorConfig>){setPanel({...panel,layout:{...panel.layout,sensor:{...getSensor(panel.layout),...next}}})}
	async function onPhotoFile(file:File|undefined){
		if(!file)return
		try{
			const photoDataUrl=await fileToPhotoDataUrl(file)
			setPanel({...panel,layout:{...panel.layout,photoDataUrl}})
			setMessage('Фото добавлено. Сохраните изменения, чтобы оно попало на PNG.')
		}catch(error){
			setMessage(error instanceof Error?error.message:'Не удалось загрузить фото')
		}
		if(photoInput.current)photoInput.current.value=''
	}
	function clearPhoto(){
		const {photoDataUrl:_removed,...layout}=panel.layout
		setPanel({...panel,layout})
	}
	const previewWeather={...weather,layout:panel.layout,display:buildDisplay(panel.screenWidth,panel.screenHeight,panel.colorMode)}
	const refreshValue=refreshPresets.includes(panel.refreshMinutes)?String(panel.refreshMinutes):'custom'
	const quietHours=getQuietHours(panel.layout)
	const quietRefreshValue=refreshPresets.includes(quietHours.refreshMinutes)?String(quietHours.refreshMinutes):'custom'
	const sizePreset=sizePresetId(panel.screenWidth,panel.screenHeight)
	const colorMeta=COLOR_MODES[panel.colorMode]
	const addableBlocks=unusedBlocks.filter(id=>layoutWithAdded(id)!==null)
	const canAddCard=panel.layout.blocks.length<MAX_BLOCKS&&addableBlocks.length>0
	const selected=selectedId&&panel.layout.blocks.includes(selectedId)?selectedId:null
	const header=getHeader(panel.layout)
	const sensorFields=getSensor(panel.layout)
	const selectedSpan=selected?getCardSpan(panel.layout,selected):1
	const selectedRowSpan=selected?getCardRowSpan(panel.layout,selected):1
	const catalogIds=adding?addableBlocks:selected?BLOCK_IDS.filter(id=>id===selected||!panel.layout.blocks.includes(id)):[]
	const empty=adding?findEmptySlot(panel.layout):null
	const catalogSpan=adding?(empty?.colSpan??1):selectedSpan
	const catalogRowSpan=adding?1:selectedRowSpan
	const overlayRadius=getCornerRadius(panel.layout)

	return <main className="desk-shell"><header className="desk-header"><div><p className="eyebrow">E‑INK CONTROL DESK</p><h1>{panel.name}</h1></div><div className="header-actions"><span className="user-chip">{username}</span><button className="text-button" onClick={logout}>Выйти</button></div></header>
		<div className="desk-grid"><aside className="control-rail">
			<section className="control-section"><div className="section-heading"><span>01</span><h2>Экран</h2></div><label>Название панели<input value={panel.name} onChange={e=>setPanel({...panel,name:e.target.value})}/></label>
				<div className="city-picker"><label htmlFor="city-search">Город</label><div className="city-search-row"><div className="city-input-wrap"><span aria-hidden="true">⌕</span><input id="city-search" role="combobox" aria-expanded={searching||cities.length>0||searchAttempted} aria-controls="city-results" aria-autocomplete="list" placeholder="Начните вводить город" value={cityQuery} onChange={e=>{setCityQuery(e.target.value);setCities([]);setSearchAttempted(false);setCityError('')}} autoComplete="off"/>{searching&&<i aria-label="Поиск города"/>}</div><button className="locate-button" type="button" onClick={locateCity} disabled={locating}><span aria-hidden="true">◎</span>{locating?'Определяем…':'Определить по GPS'}</button></div>
					{cityQuery.trim().length>=2&&cityQuery!==panel.cityName&&(searching||cities.length>0||searchAttempted)&&<div className="city-results" id="city-results" role="listbox">{searching&&<p>Ищем подходящие города…</p>}{!searching&&cities.map(city=><button key={city.id} type="button" role="option" aria-selected="false" onClick={()=>chooseCity(city)}><strong>{city.name}</strong><span>{[city.region,city.country].filter(Boolean).join(' · ')}</span><small>{city.timezone}</small></button>)}{!searching&&searchAttempted&&cities.length===0&&!cityError&&<p>Ничего не найдено. Проверьте название.</p>}</div>}
					<div className="selected-city"><span className="selected-city-mark" aria-hidden="true">●</span><div><b>{panel.cityName}</b><small>{panel.latitude.toFixed(3)}, {panel.longitude.toFixed(3)} · {panel.timezone}</small></div></div>{cityError&&<p className="city-error" role="alert">{cityError}</p>}<p className="location-note">GPS используется только после нажатия. Геокодирование: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></p>
				</div>
				<div className="two-columns"><label>Язык<select value={panel.language} onChange={e=>setPanel({...panel,language:e.target.value as EditablePanel['language']})}><option value="RU">Русский</option><option value="EN">English</option></select></label><label>Единицы<select value={panel.unitSystem} onChange={e=>setPanel({...panel,unitSystem:e.target.value as EditablePanel['unitSystem']})}><option value="METRIC">°C · м/с · мм</option><option value="IMPERIAL">°F · mph · inHg</option></select></label></div>
				<label>Тема экрана<select value={getScreenTheme(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,theme:normalizeScreenTheme(e.target.value as ScreenThemeId)}})}>{SCREEN_THEME_IDS.map(id=><option key={id} value={id}>{SCREEN_THEMES[id].label}</option>)}</select></label>
				<label>Размер шрифта<input type="range" min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} step={5} value={getFontSize(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,fontSize:normalizeFontSize(Number(e.target.value))}})}/><small>{getFontSize(panel.layout)}%</small></label>
				<label>Закругление<input type="range" min={MIN_CORNER_RADIUS} max={MAX_CORNER_RADIUS} step={2} value={getCornerRadius(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,cornerRadius:normalizeCornerRadius(Number(e.target.value))}})}/><small>{getCornerRadius(panel.layout)} px</small></label>
				<label>Зазор<input type="range" min={MIN_CARD_GAP} max={MAX_CARD_GAP} step={1} value={getCardGap(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,cardGap:normalizeCardGap(Number(e.target.value))}})}/><small>{getCardGap(panel.layout)} px · между карточками и от края</small></label>
				<label className="chrome-toggle"><span>Общая рамка</span><input type="checkbox" checked={getShowFrame(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,showFrame:e.target.checked}})}/></label>
				<label className="chrome-toggle"><span>Рамки карточек</span><input type="checkbox" checked={getShowBorder(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,showBorder:e.target.checked}})}/></label>
				<button className="text-button header-edit-link" type="button" onClick={selectHeader}>Настроить шапку экрана</button>
			</section>
			<section className="control-section"><div className="section-heading"><span>02</span><h2>Плата</h2></div>
				<label>Обновление<select value={refreshValue} onChange={e=>setPanel({...panel,refreshMinutes:e.target.value==='custom'?90:Number(e.target.value)})}>{refreshSelectOptions()}</select></label>
				{refreshValue==='custom'&&<label>Свой интервал, минут<input type="number" min={1} max={1440} value={panel.refreshMinutes} onChange={e=>setPanel({...panel,refreshMinutes:Math.max(1,Math.min(1440,Number(e.target.value)))})}/><small>От 1 минуты до 1 дня</small></label>}
				<label className="chrome-toggle"><span>Ночной интервал</span><input type="checkbox" checked={quietHours.enabled} onChange={e=>patchQuietHours({enabled:e.target.checked})}/></label>
				{quietHours.enabled&&<>
					<div className="two-columns"><label>С<select value={quietHours.startHour} onChange={e=>patchQuietHours({startHour:Number(e.target.value)})}>{hourOptions.map(hour=><option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label><label>До<select value={quietHours.endHour} onChange={e=>patchQuietHours({endHour:Number(e.target.value)})}>{hourOptions.map(hour=><option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label></div>
					<label>Интервал ночью<select value={quietRefreshValue} onChange={e=>patchQuietHours({refreshMinutes:e.target.value==='custom'?90:Number(e.target.value)})}>{refreshSelectOptions()}</select></label>
					{quietRefreshValue==='custom'&&<label>Свой ночной интервал, минут<input type="number" min={1} max={1440} value={quietHours.refreshMinutes} onChange={e=>patchQuietHours({refreshMinutes:Math.max(1,Math.min(1440,Number(e.target.value)))})}/><small>От 1 минуты до 1 дня</small></label>}
					<p className="section-note">По часовому поясу города. «До» не входит в окно: {hourLabel(quietHours.startHour)}–{hourLabel(quietHours.endHour)}. Если «С» и «До» совпадают, ограничение не действует.</p>
				</>}
				<label className="chrome-toggle"><span>Кешировать PNG</span><input type="checkbox" checked={getCacheScreen(panel.layout)} onChange={e=>setPanel({...panel,layout:{...panel.layout,cacheScreen:e.target.checked}})}/></label>
				<p className="section-note">{getCacheScreen(panel.layout)?'Если погода не изменилась, устройство получит 304 и не перерисует экран.':'Каждый запрос отдаёт новый PNG с актуальным временем, даже если погода та же.'}</p>
				<label>Разрешение экрана<select value={customSize?'custom':sizePreset} onChange={e=>{const preset=SIZE_PRESETS.find(item=>item.id===e.target.value);if(!preset||preset.id==='custom'){setCustomSize(true);return}setCustomSize(false);applyDisplay({screenWidth:preset.width,screenHeight:preset.height})}}>{SIZE_PRESETS.map(preset=><option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
				{(customSize||sizePreset==='custom')&&<div className="two-columns"><label>Ширина, px<input type="number" min={MIN_SCREEN} max={MAX_SCREEN} step={2} value={panel.screenWidth} onChange={e=>applyDisplay({screenWidth:Math.max(MIN_SCREEN,Math.min(MAX_SCREEN,Number(e.target.value)||MIN_SCREEN))})}/></label><label>Высота, px<input type="number" min={MIN_SCREEN} max={MAX_SCREEN} step={2} value={panel.screenHeight} onChange={e=>applyDisplay({screenHeight:Math.max(MIN_SCREEN,Math.min(MAX_SCREEN,Number(e.target.value)||MIN_SCREEN))})}/></label></div>}
				<label>Цвета панели<select value={panel.colorMode} onChange={e=>applyDisplay({colorMode:e.target.value as ColorModeId})}>{COLOR_MODE_IDS.map(id=><option key={id} value={id}>{COLOR_MODES[id].label}</option>)}</select></label>
				<div className="palette-row" aria-hidden="true">{(colorMeta.palette.length?colorMeta.palette:['#1d4ed8','#c45c26','#f2c200','#15803d','#11130f','#f6f1e6']).map(hex=><i key={hex} style={{background:hex}}/>)}</div>
				<p className="section-note">{panel.screenWidth}×{panel.screenHeight} · {colorMeta.colors?`${colorMeta.colors} цвета`:'RGB'} · {panel.colorMode==='rgb'?'полноцветный PNG (обычно больше 64 КБ — текущая прошивка FireBeetle его не примет)':'PNG упаковывается в палитру экрана'}</p>
			</section>
			<section className="control-section link-section"><div className="section-heading"><span>03</span><h2>Ссылка устройства</h2></div><code>{baseUrl}</code><div className="button-row"><button className="secondary-button" onClick={()=>copy(baseUrl)}>Копировать URL</button><button className="text-button danger" onClick={rotate}>Заменить</button></div><p className="section-note">В прошивку вставляется только этот базовый URL. Wi‑Fi остаётся локально на плате.</p>
				<div className="config-url"><span>CONFIG</span><code>{configUrl}</code><button className="secondary-button" type="button" onClick={()=>copy(configUrl)}>Копировать</button></div>
			</section>
			<div className="save-dock"><button className="primary-button" onClick={save} disabled={saving}>{saving?'Сохраняем…':'Сохранить изменения'}</button>{message&&<p className="save-message" role="status">{message}</p>}</div>
		</aside><section className="preview-area" onClick={()=>{setAdding(false);setSelectedId(null);setSelectedHeader(false)}}>
			<div className="preview-label"><div><span>EDIT ON SCREEN</span><b>{panel.screenWidth}×{panel.screenHeight} · {colorMeta.label}</b><small className="layout-hint">Карточки можно перетаскивать. Удаление — в настройках выбранной карточки.</small></div><a href={screenUrl} target="_blank" rel="noreferrer">Открыть PNG ↗</a></div>
			<div className="preview-stage" ref={previewStage}>
			<div className="device-frame" onClick={event=>event.stopPropagation()}><div className="screen-bezel component-host" ref={previewHost} style={{width:panel.screenWidth*previewScale+16,height:panel.screenHeight*previewScale+16}}>
				<DndContext id="panel-editor" sensors={sensors} collisionDetection={closestCorners} autoScroll={false} onDragStart={onDragStart} onDragEnd={onDragEnd}>
					<div className="component-preview" style={{width:panel.screenWidth,height:panel.screenHeight,transform:`scale(${previewScale})`}}>
						<SortableContext items={panel.layout.blocks} strategy={stayPutStrategy}><WeatherScreen weather={previewWeather} generatedAtLocal={previewWeather.observedAt} renderHeader={content=>content?<div className={`screen-header-hit${selectedHeader?' is-selected':''}`} style={{overflow:'hidden',flexShrink:0}} onClick={event=>{event.stopPropagation();selectHeader()}}>{content}</div>:<div className="header-ghost-host"><button className={`header-ghost${selectedHeader?' is-selected':''}`} type="button" onClick={event=>{event.stopPropagation();selectHeader()}}>Шапка скрыта · нажмите, чтобы настроить</button></div>} renderBlock={(id,content)=><InlineSortableBlock key={id} id={id} selected={selected===id} radius={overlayRadius} onSelect={()=>{setSelectedId(id);setAdding(false);setSelectedHeader(false)}}>{content}</InlineSortableBlock>} addSlot={canAddCard?<button className={`inline-add-slot${adding?' is-active':''}`} type="button" style={{borderRadius:overlayRadius}} onClick={event=>{event.stopPropagation();setAdding(true);setSelectedId(null);setSelectedHeader(false)}}>+ Добавить карточку</button>:undefined}/></SortableContext>
					</div>
					<LiveCardDrag weather={previewWeather} previewScale={previewScale} radius={overlayRadius}/>
				</DndContext>
			{previewLoading&&<span className="preview-loading">Обновляем погоду…</span>}</div><div className="device-foot"><span>{panel.screenWidth}×{panel.screenHeight}</span><i/><span>{colorMeta.colors?`${colorMeta.colors}C`:'RGB'}</span></div></div>
			{(selected||adding||selectedHeader)&&<aside className="card-inspector" onClick={event=>event.stopPropagation()}>
				{selectedHeader?<>
					<div className="inspector-kicker">Шапка экрана</div>
					<h2>Город и время</h2>
					<div className="inspector-toggles">
						<label><span>Показывать шапку</span><input type="checkbox" checked={header.visible} onChange={e=>patchHeader({visible:e.target.checked})}/></label>
						<label><span>Город / заголовок</span><input type="checkbox" checked={header.showCity} onChange={e=>patchHeader({showCity:e.target.checked})} disabled={!header.visible}/></label>
						<label><span>Координаты</span><input type="checkbox" checked={header.showCoords} onChange={e=>patchHeader({showCoords:e.target.checked})} disabled={!header.visible}/></label>
						<label><span>Дата</span><input type="checkbox" checked={header.showDate} onChange={e=>patchHeader({showDate:e.target.checked})} disabled={!header.visible}/></label>
						<label><span>Время</span><input type="checkbox" checked={header.showTime} onChange={e=>patchHeader({showTime:e.target.checked})} disabled={!header.visible}/></label>
						<label><span>Заряд батареи</span><input type="checkbox" checked={header.showBattery} onChange={e=>patchHeader({showBattery:e.target.checked})} disabled={!header.visible}/></label>
					</div>
					<div className="size-board">
						<label>Свой заголовок<input value={header.title??''} placeholder={panel.cityName} disabled={!header.visible} onChange={e=>patchHeader({title:e.target.value.slice(0,48)||undefined})}/><small>Пустое поле — название города</small></label>
						<div><span>Стиль</span><div className="size-pips header-style-pips">{([{id:'fill',label:'Заливка'},{id:'invert',label:'Светлая'},{id:'line',label:'Линия'}] as {id:HeaderStyle;label:string}[]).map(item=><button key={item.id} type="button" className={header.style===item.id?'is-on':''} disabled={!header.visible} onClick={()=>patchHeader({style:item.id})}>{item.label}</button>)}</div></div>
						<div><span>Высота</span><div className="size-pips header-style-pips">{([{id:'s',label:'S'},{id:'m',label:'M'},{id:'l',label:'L'}] as {id:HeaderSize;label:string}[]).map(item=><button key={item.id} type="button" className={header.size===item.id?'is-on':''} disabled={!header.visible} onClick={()=>patchHeader({size:item.id})}>{item.label}</button>)}</div></div>
						<button className="text-button" type="button" onClick={()=>setPanel({...panel,layout:{...panel.layout,header:DEFAULT_HEADER}})}>Сбросить шапку</button>
					</div>
				</>:<>
				<div className="inspector-kicker">{adding?'Новая карточка':'Карточка'}</div>
				<h2>{adding?'Выберите тип':selected?blockNames[selected]:'Карточка'}</h2>
				{selected&&!adding&&<div className="size-board">
					<p className="range-hint">Перетащите карточку на экране, чтобы сменить место.</p>
					<div><span>Ширина</span><div className="size-pips">{CARD_SPANS.map(value=><button key={value} type="button" className={selectedSpan===value?'is-on':''} disabled={!layoutFits(withCardSize(panel.layout,selected,{span:value}))} onClick={()=>resizeBlock(selected,{span:value})}>{value}/4</button>)}</div></div>
					<div><span>Высота</span><div className="size-pips pair-pips">{CARD_ROW_SPANS.map(value=><button key={value} type="button" className={selectedRowSpan===value?'is-on':''} disabled={!layoutFits(withCardSize(panel.layout,selected,{rowSpan:value}))} onClick={()=>resizeBlock(selected,{rowSpan:value})}>{value}/2</button>)}</div></div>
					<button className="text-button danger inspector-remove" type="button" onClick={()=>removeBlock(selected)} disabled={panel.layout.blocks.length<=1}>Удалить карточку</button>
				</div>}
				{selected==='photo'&&!adding&&<div className="size-board">
					<p className="range-hint">Фото заполняет карточку по короткой стороне и обрезается по краям, пропорции не растягиваются.</p>
					{panel.layout.photoDataUrl?<img className="photo-inspector-preview" src={panel.layout.photoDataUrl} alt=""/>:null}
					<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event=>void onPhotoFile(event.target.files?.[0])}/>
					<button className="secondary-button" type="button" onClick={()=>photoInput.current?.click()}>{panel.layout.photoDataUrl?'Заменить фото':'Загрузить фото'}</button>
					{panel.layout.photoDataUrl?<button className="text-button" type="button" onClick={clearPhoto}>Убрать фото</button>:null}
				</div>}
				{selected==='sensor'&&!adding&&<div className="inspector-toggles">
					<p className="range-hint">Температура всегда на карточке. Остальное можно выключить.</p>
					<label><span>Давление</span><input type="checkbox" checked={sensorFields.pressure} onChange={e=>patchSensor({pressure:e.target.checked})}/></label>
					<label><span>Высота</span><input type="checkbox" checked={sensorFields.altitude} onChange={e=>patchSensor({altitude:e.target.checked})}/></label>
					<label><span>Влажность</span><input type="checkbox" checked={sensorFields.humidity} onChange={e=>patchSensor({humidity:e.target.checked})}/></label>
				</div>}
				{selected==='sensorChart'&&!adding&&<div className="size-board">
					<div><span>Диапазон</span><div className="size-pips range-pips">{sensorRangePips.map(item=><button key={item.id} type="button" className={getSensorChartRange(panel.layout)===item.id?'is-on':''} onClick={()=>setPanel({...panel,layout:withSensorChartRange(panel.layout,item.id)})}>{item.label}</button>)}</div></div>
					<div><span>Сглаживание</span><div className="size-pips range-pips">{sensorFilterPips.map(item=><button key={item.id} type="button" className={getSensorChartFilter(panel.layout)===item.id?'is-on':''} onClick={()=>setPanel({...panel,layout:withSensorChartFilter(panel.layout,item.id)})}>{item.label}</button>)}</div></div>
					<p className="range-hint">Температура BMP/BME с платы. История копится на сервере без срока. «Без выбросов» убирает одиночный всплеск, «Медиана» сглаживает соседние точки. В превью — демо, пока ESP32 не пришлёт свои точки.</p>
				</div>}
				{selected&&!adding&&isRangeBlock(selected)&&<div className="size-board">
					<div><span>Диапазон</span><div className="size-pips range-pips">{rangePips.map(item=><button key={item.id} type="button" className={getCardRange(panel.layout,selected)===item.id?'is-on':''} onClick={()=>setPanel({...panel,layout:withCardRange(panel.layout,selected,item.id)})}>{item.label}</button>)}</div></div>
					<p className="range-hint">День, 3 дня, неделя и 2 недели — как на экране. «Мес» — максимум прогноза Open-Meteo, 16 дней.</p>
				</div>}
				<div className="inspector-catalog">{blockGroups.map(group=>{const ids=group.ids.filter(id=>catalogIds.includes(id));return ids.length?<section key={group.label}><h3>{group.label}</h3><div className="thumb-grid">{ids.map(id=><button key={id} type="button" className={`thumb-pick${selected===id?' is-current':''}`} onClick={()=>adding?addBlock(id):selected&&replaceBlock(selected,id)}><CardThumb id={id} weather={previewWeather} span={catalogSpan} rowSpan={catalogRowSpan}/><b>{blockNames[id]}</b></button>)}</div></section>:null})}</div>
				</>}
			</aside>}
			</div>
		</section></div>
	</main>
}
