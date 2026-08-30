'use client'

import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {useRouter} from 'next/navigation'
import {closestCenter,DndContext,KeyboardSensor,PointerSensor,useSensor,useSensors,type DragEndEvent} from '@dnd-kit/core'
import {arrayMove,horizontalListSortingStrategy,sortableKeyboardCoordinates,SortableContext,useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {WeatherScreen} from '@/components/weather-screen'
import {BLOCK_IDS,MAX_BLOCKS,type BlockId,type EditablePanel} from '@/lib/panel-config'
import type {WeatherScreenData} from '@/lib/weather'

type City={id:number|string;name:string;label:string;region:string;country:string;latitude:number;longitude:number;timezone:string}
const blockNames:Record<BlockId,string>={current:'Температура',forecast:'Прогноз',feels:'Ощущается',humidity:'Влажность',pressure:'Давление',precipitation:'Осадки',metrics:'Показатели',wind:'Ветер',sun:'Солнце',clouds:'Облачность'}
const refreshPresets=[5,10,15,30,60,180,360,720,1440]

function InlineSortableBlock({id,blocks,onReplace,onRemove,children}:{id:BlockId;blocks:BlockId[];onReplace:(from:BlockId,to:BlockId)=>void;onRemove:(id:BlockId)=>void;children:ReactNode}){
	const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id})
	const alternatives=BLOCK_IDS.filter(candidate=>candidate===id||!blocks.includes(candidate))
	return <div ref={setNodeRef} className={`inline-sortable${isDragging?' is-dragging':''}`} style={{transform:CSS.Transform.toString(transform),transition}}>
		<div className="card-edit-bar">
			<button className="inline-drag-handle" type="button" aria-label={`Переместить ${blockNames[id]}`} {...attributes} {...listeners}>⠿</button>
			<select aria-label="Тип блока" value={id} onChange={event=>onReplace(id,event.target.value as BlockId)}>{alternatives.map(type=><option key={type} value={type}>{blockNames[type]}</option>)}</select>
			<button className="inline-remove" type="button" onClick={()=>onRemove(id)} disabled={blocks.length===1} aria-label={`Удалить ${blockNames[id]}`}>×</button>
		</div>
		<div className="inline-card-content">{children}</div>
	</div>
}

export function PanelEditor({initialPanel,initialWeather,origin,username}:{initialPanel:EditablePanel;initialWeather:WeatherScreenData;origin:string;username:string}){
	const router=useRouter();const [panel,setPanel]=useState(initialPanel);const [weather,setWeather]=useState(initialWeather);const [cityQuery,setCityQuery]=useState(panel.cityName)
	const [cities,setCities]=useState<City[]>([]);const [searching,setSearching]=useState(false);const [searchAttempted,setSearchAttempted]=useState(false);const [locating,setLocating]=useState(false);const [cityError,setCityError]=useState('');const [previewLoading,setPreviewLoading]=useState(false)
	const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);const [previewScale,setPreviewScale]=useState(1);const previewHost=useRef<HTMLDivElement>(null)
	const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}))
	const baseUrl=`${origin}/d/${panel.slug}`;const screenUrl=`${baseUrl}/screen.png?v=${encodeURIComponent(panel.updatedAt)}`

	useEffect(()=>{const node=previewHost.current;if(!node)return;const resize=()=>setPreviewScale(Math.min(1,Math.max(.1,(node.clientWidth-16)/800)));resize();const observer=new ResizeObserver(resize);observer.observe(node);return()=>observer.disconnect()},[])
	useEffect(()=>{
		if(cityQuery.trim().length<2||cityQuery===panel.cityName)return
		const controller=new AbortController();const timer=setTimeout(async()=>{setSearching(true);setCityError('');try{const response=await fetch(`/api/cities?q=${encodeURIComponent(cityQuery)}`,{signal:controller.signal});const data=await response.json();setCities(response.ok?data.results:[]);setSearchAttempted(true);if(!response.ok)setCityError(data.error??'Не удалось найти город')}catch{if(!controller.signal.aborted){setCities([]);setSearchAttempted(true);setCityError('Поиск временно недоступен')}}finally{if(!controller.signal.aborted)setSearching(false)}},350)
		return()=>{clearTimeout(timer);controller.abort()}
	},[cityQuery,panel.cityName])
	useEffect(()=>{
		const controller=new AbortController();const timer=setTimeout(async()=>{setPreviewLoading(true);try{const response=await fetch('/api/panel/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(panel),signal:controller.signal});if(response.ok)setWeather(await response.json())}finally{if(!controller.signal.aborted)setPreviewLoading(false)}},300)
		return()=>{clearTimeout(timer);controller.abort()}
	},[panel])

	const unusedBlocks=useMemo(()=>BLOCK_IDS.filter(id=>!panel.layout.blocks.includes(id)),[panel.layout.blocks])
	function onDragEnd(event:DragEndEvent){const active=event.active.id as BlockId;const over=event.over?.id as BlockId|undefined;if(!over||active===over)return;const oldIndex=panel.layout.blocks.indexOf(active);const newIndex=panel.layout.blocks.indexOf(over);setPanel({...panel,layout:{...panel.layout,blocks:arrayMove(panel.layout.blocks,oldIndex,newIndex)}})}
	function replaceBlock(from:BlockId,to:BlockId){setPanel({...panel,layout:{...panel.layout,blocks:panel.layout.blocks.map(id=>id===from?to:id)}})}
	function removeBlock(id:BlockId){if(panel.layout.blocks.length===1)return;setPanel({...panel,layout:{...panel.layout,blocks:panel.layout.blocks.filter(item=>item!==id)}})}
	function addBlock(id:BlockId){if(panel.layout.blocks.length>=MAX_BLOCKS||panel.layout.blocks.includes(id))return;setPanel({...panel,layout:{...panel.layout,blocks:[...panel.layout.blocks,id]}})}
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
	async function save(){setSaving(true);setMessage('');const response=await fetch('/api/panel',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(panel)});const data=await response.json();if(response.ok){setPanel(data);setCityQuery(data.cityName);setMessage('Настройки сохранены.')}else setMessage(data.error??'Не удалось сохранить');setSaving(false)}
	async function rotate(){if(!confirm('Старая ссылка перестанет работать. Создать новую?'))return;const response=await fetch('/api/panel/rotate',{method:'POST'});const data=await response.json();if(response.ok){setPanel(data);setMessage('Персональная ссылка заменена.')}else setMessage(data.error??'Не удалось заменить ссылку')}
	async function copy(value:string){await navigator.clipboard.writeText(value);setMessage('Ссылка скопирована.')}
	async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.refresh()}
	const previewWeather={...weather,layout:panel.layout}
	const refreshValue=refreshPresets.includes(panel.refreshMinutes)?String(panel.refreshMinutes):'custom'

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
			</section>
			<section className="control-section link-section"><div className="section-heading"><span>02</span><h2>Ссылка устройства</h2></div><code>{baseUrl}</code><div className="button-row"><button className="secondary-button" onClick={()=>copy(baseUrl)}>Копировать URL</button><button className="text-button danger" onClick={rotate}>Заменить</button></div><p className="section-note">В прошивку вставляется только этот базовый URL. Wi‑Fi остаётся локально на плате.</p></section>
			<div className="save-dock"><button className="primary-button" onClick={save} disabled={saving}>{saving?'Сохраняем…':'Сохранить изменения'}</button>{message&&<p className="save-message" role="status">{message}</p>}</div>
		</aside><section className="preview-area"><div className="preview-label"><div><span>EDIT ON SCREEN</span><b>До 4 карточек · тяните, меняйте тип или удаляйте</b></div><a href={screenUrl} target="_blank" rel="noreferrer">Открыть PNG ↗</a></div>
			<div className="device-frame"><div className="screen-bezel component-host" ref={previewHost} style={{height:480*previewScale+16}}><div className="component-preview" style={{transform:`scale(${previewScale})`}}>
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={panel.layout.blocks} strategy={horizontalListSortingStrategy}><WeatherScreen weather={previewWeather} generatedAtLocal={previewWeather.observedAt} renderBlock={(id,content)=><InlineSortableBlock key={id} id={id} blocks={panel.layout.blocks} onReplace={replaceBlock} onRemove={removeBlock}>{content}</InlineSortableBlock>} addSlot={panel.layout.blocks.length<MAX_BLOCKS&&unusedBlocks.length>0?<div className="inline-add-slot"><select aria-label="Добавить блок" value="" onChange={e=>{if(e.target.value)addBlock(e.target.value as BlockId)}}><option value="">+ Добавить блок</option>{unusedBlocks.map(id=><option key={id} value={id}>{blockNames[id]}</option>)}</select></div>:undefined}/></SortableContext></DndContext>
			</div>{previewLoading&&<span className="preview-loading">Обновляем погоду…</span>}</div><div className="device-foot"><span>FPC‑8612</span><i/><span>SPI / 7.5″</span></div></div>
			<div className="endpoint-strip"><div><span>CONFIG</span><code>{baseUrl}/config</code></div><button onClick={()=>copy(`${baseUrl}/config`)}>Копировать</button></div>
		</section></div>
	</main>
}
