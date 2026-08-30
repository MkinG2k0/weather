'use client'

import {useEffect,useMemo,useRef,useState,type MouseEvent,type ReactNode} from 'react'
import {useRouter} from 'next/navigation'
import {closestCenter,DndContext,KeyboardSensor,PointerSensor,useSensor,useSensors,type DragEndEvent} from '@dnd-kit/core'
import {arrayMove,rectSortingStrategy,sortableKeyboardCoordinates,SortableContext,useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {WeatherScreen,renderPanelCard} from '@/components/weather-screen'
import {buildDisplay,COLOR_MODES,COLOR_MODE_IDS,MIN_SCREEN,MAX_SCREEN,sizePresetId,SIZE_PRESETS,type ColorModeId} from '@/lib/display'
import {BLOCK_IDS,CARD_ROW_SPANS,CARD_SPANS,MAX_BLOCKS,findEmptySlot,getCardRowSpan,getCardSpan,getDefaultCardSpan,layoutFits,withCardSize,type BlockId,type CardRowSpan,type CardSpan,type EditablePanel} from '@/lib/panel-config'
import type {WeatherScreenData} from '@/lib/weather'

type City={id:number|string;name:string;label:string;region:string;country:string;latitude:number;longitude:number;timezone:string}
const blockNames:Record<BlockId,string>={current:'Температура',overview:'Полная сводка',photo:'Фото',weatherScene:'Фото / погодная сцена',clock:'Часы · циферблат',forecast:'Почасовой прогноз',dailyForecast:'Прогноз на 7 дней',weekStrip:'Неделя · иконки',weekTiles:'Неделя · плитки',weekRange:'Неделя · диапазон',temperatureChart:'График температуры',precipitationChart:'График осадков',windChart:'График ветра',feels:'Ощущается',humidity:'Влажность',pressure:'Давление',precipitation:'Вероятность осадков',precipitationDetail:'Состав осадков',metrics:'Главные показатели',wind:'Ветер',sun:'Восход · закат · УФ',daylight:'Световой день',clouds:'Облачность',cloudLayers:'Слои облаков',visibility:'Видимость',dewPoint:'Точка росы',uv:'УФ-индекс',radiation:'Солнечная энергия',airQuality:'Качество воздуха',sensor:'Датчик BMP280'}
const blockGroups:{label:string;ids:BlockId[]}[]=[
	{label:'Главное',ids:['current','overview','weatherScene','clock','metrics']},
	{label:'Прогнозы и графики',ids:['forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','precipitationChart','windChart']},
	{label:'Атмосфера',ids:['feels','humidity','pressure','visibility','dewPoint','airQuality']},
	{label:'Осадки, ветер и облака',ids:['precipitation','precipitationDetail','wind','clouds','cloudLayers']},
	{label:'Солнце',ids:['sun','daylight','uv','radiation']},
	{label:'Устройство',ids:['photo','sensor']},
]
const refreshPresets=[5,10,15,30,60,180,360,720,1440]
const CELL=182
const GAP=10

function cardBox(span:CardSpan,rowSpan:CardRowSpan){return {width:span*CELL+(span-1)*GAP,height:rowSpan*CELL+(rowSpan-1)*GAP}}

function CardThumb({id,weather,span,rowSpan}:{id:BlockId;weather:WeatherScreenData;span:CardSpan;rowSpan:CardRowSpan}){
	const box=cardBox(span,rowSpan)
	const scale=Math.min(220/box.width,(rowSpan===2?196:108)/box.height)
	return <div className="card-thumb" style={{width:box.width*scale,height:box.height*scale}}>
		<div className="card-thumb-stage" style={{width:box.width,height:box.height,transform:`scale(${scale})`}}>
			<div style={{display:'flex',width:box.width,height:box.height}}>{renderPanelCard(id,weather,rowSpan===1,span)}</div>
		</div>
	</div>
}

function InlineSortableBlock({id,selected,onSelect,onRemove,canRemove,children}:{id:BlockId;selected:boolean;onSelect:()=>void;onRemove:()=>void;canRemove:boolean;children:ReactNode}){
	const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id})
	return <div ref={setNodeRef} className={`inline-sortable${isDragging?' is-dragging':''}${selected?' is-selected':''}`} style={{transform:CSS.Translate.toString(transform),transition}} onClick={(event:MouseEvent)=>{event.stopPropagation();onSelect()}}>
		<div className="card-edit-bar">
			<button className="inline-drag-handle" type="button" aria-label={`Переместить ${blockNames[id]}`} {...attributes} {...listeners}>⠿</button>
			<button className="inline-remove" type="button" onClick={event=>{event.stopPropagation();onRemove()}} disabled={!canRemove} aria-label={`Удалить ${blockNames[id]}`}>×</button>
		</div>
		<div className="inline-card-content">{children}</div>
	</div>
}

export function PanelEditor({initialPanel,initialWeather,origin,username}:{initialPanel:EditablePanel;initialWeather:WeatherScreenData;origin:string;username:string}){
	const router=useRouter();const [panel,setPanel]=useState(initialPanel);const [weather,setWeather]=useState(initialWeather);const [cityQuery,setCityQuery]=useState(panel.cityName)
	const [cities,setCities]=useState<City[]>([]);const [searching,setSearching]=useState(false);const [searchAttempted,setSearchAttempted]=useState(false);const [locating,setLocating]=useState(false);const [cityError,setCityError]=useState('');const [previewLoading,setPreviewLoading]=useState(false)
	const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);const [previewScale,setPreviewScale]=useState(1);const previewHost=useRef<HTMLDivElement>(null);const previewStage=useRef<HTMLDivElement>(null)
	const [selectedId,setSelectedId]=useState<BlockId|null>(null);const [adding,setAdding]=useState(false)
	const [customSize,setCustomSize]=useState(()=>sizePresetId(initialPanel.screenWidth,initialPanel.screenHeight)==='custom')
	const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}))
	const baseUrl=`${origin}/d/${panel.slug}`;const screenUrl=`${baseUrl}/screen.png?v=${encodeURIComponent(panel.updatedAt)}`

	useEffect(()=>{
		const stage=previewStage.current
		if(!stage)return
		const resize=()=>{
			const maxW=Math.max(160,stage.clientWidth-36)
			const maxH=Math.max(160,window.innerHeight-220)
			setPreviewScale(Math.min(1,Math.max(.12,Math.min(maxW/panel.screenWidth,maxH/panel.screenHeight))))
		}
		resize()
		const observer=new ResizeObserver(resize)
		observer.observe(stage)
		window.addEventListener('resize',resize)
		return()=>{observer.disconnect();window.removeEventListener('resize',resize)}
	},[panel.screenWidth,panel.screenHeight])
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
	function onDragEnd(event:DragEndEvent){const active=event.active.id as BlockId;const over=event.over?.id as BlockId|undefined;if(!over||active===over)return;const oldIndex=panel.layout.blocks.indexOf(active);const newIndex=panel.layout.blocks.indexOf(over);const layout={...panel.layout,blocks:arrayMove(panel.layout.blocks,oldIndex,newIndex)};if(layoutFits(layout))setPanel({...panel,layout});else setMessage('В таком порядке карточки не помещаются в два ряда.')}
	function replaceBlock(from:BlockId,to:BlockId){
		if(from===to)return
		const spans={...panel.layout.spans};const span=spans[from];delete spans[from];if(span)spans[to]=span
		const rowSpans={...panel.layout.rowSpans};const rowSpan=rowSpans[from];delete rowSpans[from];if(rowSpan)rowSpans[to]=rowSpan
		setPanel({...panel,layout:{...panel.layout,blocks:panel.layout.blocks.map(id=>id===from?to:id),spans,rowSpans:Object.keys(rowSpans).length?rowSpans:undefined}})
		setSelectedId(to)
	}
	function resizeBlock(id:BlockId,size:{span?:CardSpan;rowSpan?:CardRowSpan}){const layout=withCardSize(panel.layout,id,size);if(layoutFits(layout)){setPanel({...panel,layout});setMessage('')}else setMessage('Эта ширина или высота не помещается в сетку 4×2.')}
	function removeBlock(id:BlockId){if(panel.layout.blocks.length===1)return;const spans={...panel.layout.spans};delete spans[id];const rowSpans={...panel.layout.rowSpans};delete rowSpans[id];const blocks=panel.layout.blocks.filter(item=>item!==id);setPanel({...panel,layout:{...panel.layout,blocks,spans,rowSpans:Object.keys(rowSpans).length?rowSpans:undefined}});if(selectedId===id)setSelectedId(blocks[0]??null)}
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
	const previewWeather={...weather,layout:panel.layout,display:buildDisplay(panel.screenWidth,panel.screenHeight,panel.colorMode)}
	const refreshValue=refreshPresets.includes(panel.refreshMinutes)?String(panel.refreshMinutes):'custom'
	const sizePreset=sizePresetId(panel.screenWidth,panel.screenHeight)
	const colorMeta=COLOR_MODES[panel.colorMode]
	const addableBlocks=unusedBlocks.filter(id=>layoutWithAdded(id)!==null)
	const canAddCard=panel.layout.blocks.length<MAX_BLOCKS&&addableBlocks.length>0
	const selected=selectedId&&panel.layout.blocks.includes(selectedId)?selectedId:null
	const selectedSpan=selected?getCardSpan(panel.layout,selected):1
	const selectedRowSpan=selected?getCardRowSpan(panel.layout,selected):1
	const catalogIds=adding?addableBlocks:selected?BLOCK_IDS.filter(id=>id===selected||!panel.layout.blocks.includes(id)):[]
	const empty=adding?findEmptySlot(panel.layout):null
	const catalogSpan=adding?(empty?.colSpan??1):selectedSpan
	const catalogRowSpan=adding?1:selectedRowSpan

	return <main className="desk-shell"><header className="desk-header"><div><p className="eyebrow">E‑INK CONTROL DESK</p><h1>{panel.name}</h1></div><div className="header-actions"><span className="user-chip">{username}</span><button className="text-button" onClick={logout}>Выйти</button></div></header>
		<div className="desk-grid"><aside className="control-rail">
			<section className="control-section"><div className="section-heading"><span>01</span><h2>Место и формат</h2></div><label>Название панели<input value={panel.name} onChange={e=>setPanel({...panel,name:e.target.value})}/></label>
				<div className="city-picker"><label htmlFor="city-search">Город</label><div className="city-search-row"><div className="city-input-wrap"><span aria-hidden="true">⌕</span><input id="city-search" role="combobox" aria-expanded={searching||cities.length>0||searchAttempted} aria-controls="city-results" aria-autocomplete="list" placeholder="Начните вводить город" value={cityQuery} onChange={e=>{setCityQuery(e.target.value);setCities([]);setSearchAttempted(false);setCityError('')}} autoComplete="off"/>{searching&&<i aria-label="Поиск города"/>}</div><button className="locate-button" type="button" onClick={locateCity} disabled={locating}><span aria-hidden="true">◎</span>{locating?'Определяем…':'Определить по GPS'}</button></div>
					{cityQuery.trim().length>=2&&cityQuery!==panel.cityName&&(searching||cities.length>0||searchAttempted)&&<div className="city-results" id="city-results" role="listbox">{searching&&<p>Ищем подходящие города…</p>}{!searching&&cities.map(city=><button key={city.id} type="button" role="option" aria-selected="false" onClick={()=>chooseCity(city)}><strong>{city.name}</strong><span>{[city.region,city.country].filter(Boolean).join(' · ')}</span><small>{city.timezone}</small></button>)}{!searching&&searchAttempted&&cities.length===0&&!cityError&&<p>Ничего не найдено. Проверьте название.</p>}</div>}
					<div className="selected-city"><span className="selected-city-mark" aria-hidden="true">●</span><div><b>{panel.cityName}</b><small>{panel.latitude.toFixed(3)}, {panel.longitude.toFixed(3)} · {panel.timezone}</small></div></div>{cityError&&<p className="city-error" role="alert">{cityError}</p>}<p className="location-note">GPS используется только после нажатия. Геокодирование: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></p>
				</div>
				<div className="two-columns"><label>Язык<select value={panel.language} onChange={e=>setPanel({...panel,language:e.target.value as EditablePanel['language']})}><option value="RU">Русский</option><option value="EN">English</option></select></label><label>Единицы<select value={panel.unitSystem} onChange={e=>setPanel({...panel,unitSystem:e.target.value as EditablePanel['unitSystem']})}><option value="METRIC">°C · м/с · мм</option><option value="IMPERIAL">°F · mph · inHg</option></select></label></div>
				<label>Обновление<select value={refreshValue} onChange={e=>setPanel({...panel,refreshMinutes:e.target.value==='custom'?90:Number(e.target.value)})}><option value={5}>5 минут</option><option value={10}>10 минут</option><option value={15}>15 минут</option><option value={30}>30 минут</option><option value={60}>1 час</option><option value={180}>3 часа</option><option value={360}>6 часов</option><option value={720}>12 часов</option><option value={1440}>1 день</option><option value="custom">Свой интервал</option></select></label>
				{refreshValue==='custom'&&<label>Свой интервал, минут<input type="number" min={5} max={1440} value={panel.refreshMinutes} onChange={e=>setPanel({...panel,refreshMinutes:Math.max(5,Math.min(1440,Number(e.target.value)))})}/><small>От 5 минут до 1 дня</small></label>}
				<label>Разрешение экрана<select value={customSize?'custom':sizePreset} onChange={e=>{const preset=SIZE_PRESETS.find(item=>item.id===e.target.value);if(!preset||preset.id==='custom'){setCustomSize(true);return}setCustomSize(false);applyDisplay({screenWidth:preset.width,screenHeight:preset.height})}}>{SIZE_PRESETS.map(preset=><option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
				{(customSize||sizePreset==='custom')&&<div className="two-columns"><label>Ширина, px<input type="number" min={MIN_SCREEN} max={MAX_SCREEN} step={2} value={panel.screenWidth} onChange={e=>applyDisplay({screenWidth:Math.max(MIN_SCREEN,Math.min(MAX_SCREEN,Number(e.target.value)||MIN_SCREEN))})}/></label><label>Высота, px<input type="number" min={MIN_SCREEN} max={MAX_SCREEN} step={2} value={panel.screenHeight} onChange={e=>applyDisplay({screenHeight:Math.max(MIN_SCREEN,Math.min(MAX_SCREEN,Number(e.target.value)||MIN_SCREEN))})}/></label></div>}
				<label>Цвета панели<select value={panel.colorMode} onChange={e=>applyDisplay({colorMode:e.target.value as ColorModeId})}>{COLOR_MODE_IDS.map(id=><option key={id} value={id}>{COLOR_MODES[id].label}</option>)}</select></label>
				<div className="palette-row" aria-hidden="true">{(colorMeta.palette.length?colorMeta.palette:['#1d4ed8','#c45c26','#f2c200','#15803d','#11130f','#f6f1e6']).map(hex=><i key={hex} style={{background:hex}}/>)}</div>
				<p className="section-note">{panel.screenWidth}×{panel.screenHeight} · {colorMeta.colors?`${colorMeta.colors} цвета`:'RGB'} · PNG квантуется в выбранную палитру</p>
			</section>
			<section className="control-section link-section"><div className="section-heading"><span>02</span><h2>Ссылка устройства</h2></div><code>{baseUrl}</code><div className="button-row"><button className="secondary-button" onClick={()=>copy(baseUrl)}>Копировать URL</button><button className="text-button danger" onClick={rotate}>Заменить</button></div><p className="section-note">В прошивку вставляется только этот базовый URL. Wi‑Fi остаётся локально на плате.</p></section>
			<div className="save-dock"><button className="primary-button" onClick={save} disabled={saving}>{saving?'Сохраняем…':'Сохранить изменения'}</button>{message&&<p className="save-message" role="status">{message}</p>}</div>
		</aside><section className="preview-area" onClick={()=>{setAdding(false);setSelectedId(null)}}>
			<div className="preview-label"><div><span>EDIT ON SCREEN</span><b>{panel.screenWidth}×{panel.screenHeight} · {colorMeta.label}</b></div><a href={screenUrl} target="_blank" rel="noreferrer">Открыть PNG ↗</a></div>
			<div className="preview-stage" ref={previewStage}>
			<div className="device-frame" onClick={event=>event.stopPropagation()}><div className="screen-bezel component-host" ref={previewHost} style={{width:panel.screenWidth*previewScale+16,height:panel.screenHeight*previewScale+16}}><div className="component-preview" style={{width:panel.screenWidth,height:panel.screenHeight,transform:`scale(${previewScale})`}}>
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={panel.layout.blocks} strategy={rectSortingStrategy}><WeatherScreen weather={previewWeather} generatedAtLocal={previewWeather.observedAt} renderBlock={(id,content)=><InlineSortableBlock key={id} id={id} selected={selected===id} onSelect={()=>{setSelectedId(id);setAdding(false)}} onRemove={()=>removeBlock(id)} canRemove={panel.layout.blocks.length>1}>{content}</InlineSortableBlock>} addSlot={canAddCard?<button className={`inline-add-slot${adding?' is-active':''}`} type="button" onClick={event=>{event.stopPropagation();setAdding(true);setSelectedId(null)}}>+ Добавить карточку</button>:undefined}/></SortableContext></DndContext>
			</div>{previewLoading&&<span className="preview-loading">Обновляем погоду…</span>}</div><div className="device-foot"><span>{panel.screenWidth}×{panel.screenHeight}</span><i/><span>{colorMeta.colors?`${colorMeta.colors}C`:'RGB'}</span></div></div>
			{(selected||adding)&&<aside className="card-inspector" onClick={event=>event.stopPropagation()}>
				<div className="inspector-kicker">{adding?'Новая карточка':'Карточка'}</div>
				<h2>{adding?'Выберите тип':selected?blockNames[selected]:'Карточка'}</h2>
				{selected&&!adding&&<div className="size-board">
					<div><span>Ширина</span><div className="size-pips">{CARD_SPANS.map(value=><button key={value} type="button" className={selectedSpan===value?'is-on':''} disabled={!layoutFits(withCardSize(panel.layout,selected,{span:value}))} onClick={()=>resizeBlock(selected,{span:value})}>{value}/4</button>)}</div></div>
					<div><span>Высота</span><div className="size-pips">{CARD_ROW_SPANS.map(value=><button key={value} type="button" className={selectedRowSpan===value?'is-on':''} disabled={!layoutFits(withCardSize(panel.layout,selected,{rowSpan:value}))} onClick={()=>resizeBlock(selected,{rowSpan:value})}>{value}/2</button>)}</div></div>
				</div>}
				<div className="inspector-catalog">{blockGroups.map(group=>{const ids=group.ids.filter(id=>catalogIds.includes(id));return ids.length?<section key={group.label}><h3>{group.label}</h3><div className="thumb-grid">{ids.map(id=><button key={id} type="button" className={`thumb-pick${selected===id?' is-current':''}`} onClick={()=>adding?addBlock(id):selected&&replaceBlock(selected,id)}><CardThumb id={id} weather={previewWeather} span={catalogSpan} rowSpan={catalogRowSpan}/><b>{blockNames[id]}</b></button>)}</div></section>:null})}</div>
			</aside>}
			</div>
			<div className="endpoint-strip"><div><span>CONFIG</span><code>{baseUrl}/config</code></div><button onClick={()=>copy(`${baseUrl}/config`)}>Копировать</button></div>
		</section></div>
	</main>
}
