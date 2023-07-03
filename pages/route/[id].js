import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import { getActiveOrganization } from '../../src/gql/statistic'
import { getOrdersForRouting } from '../../src/gql/order'
import { getRoute, addRoute, buildRoute, listDownload, listUnload, getUnloadingInvoicesFromRouting, setRoute } from '../../src/gql/route'
import { getDistricts } from '../../src/gql/district'
import { getDistributer } from '../../src/gql/distributer'
import { getEcspeditors } from '../../src/gql/employment'
import { getAutos } from '../../src/gql/auto'
import routeStyle from '../../src/styleMUI/route/route'
import { useRouter } from 'next/router'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import CardOrder from '../../components/order/CardOrder';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { bindActionCreators } from 'redux'
import * as mini_dialogActions from '../../redux/actions/mini_dialog'
import * as snackbarActions from '../../redux/actions/snackbar'
import * as appActions from '../../redux/actions/app'
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Router from 'next/router'
import { urlMain } from '../../redux/constants/other'
import { getClientGqlSsr } from '../../src/getClientGQL'
import initialApp from '../../src/initialApp'
import Autocomplete from '@material-ui/lab/Autocomplete';
import Fab from '@material-ui/core/Fab';
import Menu from '@material-ui/core/Menu';
import SettingsIcon from '@material-ui/icons/Settings';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {pdDatePicker, checkInt, checkFloat, inputInt} from '../../src/lib'
import ListOrder from '../../components/dialog/ListOrder'
import GeoRoute from '../../components/dialog/GeoRoute'
import ItemList from '../../components/dialog/ItemList'
import AddOrder from '../../components/dialog/AddOrder'
import IconButton from '@material-ui/core/IconButton';
import RemoveIcon from '@material-ui/icons/Remove';

const Route = React.memo((props) => {
    const classes = routeStyle();
    const { data } = props;
    const router = useRouter()
    const { isMobileApp } = props.app;
    const { profile } = props.user;
    const { setMiniDialog, showMiniDialog, showFullDialog, setFullDialog } = props.mini_dialogActions;
    const { showSnackBar } = props.snackbarActions;
    const { showLoad } = props.appActions;
    let [screen, setScreen] = useState('setting');
    let [provider, setProvider] = useState(data.route?data.route.provider?data.route.provider:{name: 'ZAKAJI.KZ', _id: 'super'}:{});
    let handleProvider = (async (provider) => {
        setSelectDistricts([])
        setSelectProdusers([])
        setSelectEcspeditor({})
        setSelectAuto({})
        setOrders([])
        setSelectedOrders([])
        if(provider){
            let distributer = (await getDistributer({_id: provider._id})).distributer
            produsers = [...provider._id!=='super'?[provider]:[], ...distributer?distributer.provider:[]]
            setProdusers([...produsers])
            ecspeditors = (await getEcspeditors({_id: provider._id})).ecspeditors
            if(ecspeditors)
                setEcspeditors([...ecspeditors])
            autos = (await getAutos({search: '', sort: 'name', organization: provider._id})).autos
            if(autos)
                setAutos([...autos])
            setDistricts([{name: 'Все', _id: 'super', client: [] }, ...(await getDistricts({search: '', sort: 'name', organization: provider._id})).districts])
        }
        else {
            setProdusers([])
            setDistricts([])
            setAutos([])
            setEcspeditors([])
        }
        setProvider(provider)
    })
    let [produsers, setProdusers] = React.useState(data.route?data.route.selectProdusers:[]);
    let [deletedOrders, setDeletedOrders] = useState([]);
    let [selectProdusers, setSelectProdusers] = useState(data.route?data.route.selectProdusers:[]);
    let handleSelectProdusers = (async (event) => {
        setSelectProdusers(event.target.value)
    })
    let [districts, setDistricts] = useState(data.route?data.route.selectDistricts:[]);
    let [selectDistricts, setSelectDistricts] = useState(data.route?data.route.selectDistricts:[]);
    let handleSelectDistricts = (async (event) => {
        setSelectDistricts(event.target.value)
    })
    let [ecspeditors, setEcspeditors] = React.useState([]);
    let [selectEcspeditor, setSelectEcspeditor] = React.useState(data.route?data.route.selectEcspeditor:{});
    let [orders, setOrders] = React.useState(data.route?data.route.selectedOrders:[]);
    let [autos, setAutos] = React.useState([]);
    let [selectAuto, setSelectAuto] = React.useState(data.route?data.route.selectAuto:{});
    let [allPrice, setAllPrice] = useState(0);
    let [allSize, setAllSize] = useState(0);
    let [allTonnage, setAllTonnage] = useState(0);
    let [allReturnedPrice, setAllReturnedPrice] = useState(0);
    let [dateDelivery, setDateDelivery] = useState(data.route?pdDatePicker(new Date(data.route.dateDelivery)):undefined);
    let [showStat, setShowStat] = useState(false);
    let [deliverys, setDeliverys] = useState(data.route?data.route.deliverys:[]);
    let [pagination, setPagination] = useState(100);
    let [length, setLength] = useState('');
    const checkPagination = ()=>{
        if(pagination<orders.length){
            setPagination(pagination+100)
        }
    }
    let [selectedOrders, setSelectedOrders] = useState(data.route?data.route.selectedOrders:[]);
    let [anchorEl, setAnchorEl] = useState(null);
    let open = event => {
        setAnchorEl(event.currentTarget);
    };
    let close = () => {
        setAnchorEl(null);
    };
    useEffect(()=>{
        (async ()=>{
            if(router.query.id==='new'&&profile.organization) {
                for(let i=0;i<data.organizations.length;i++){
                    if(data.organizations[i]._id===profile.organization)
                        handleProvider(data.organizations[i])
                }
            }
        })()
    },[])
    useEffect(()=>{
        (async ()=>{
            if(router.query.id==='new'&&selectProdusers.length>0&&provider&&provider._id&&selectDistricts.length>0&&dateDelivery) {
                await showLoad(true)
                let clients = []
                for(let i=0;i<selectDistricts.length;i++){
                    clients = [...clients, ...selectDistricts[i].client.map(element=>element._id)]
                }
                setOrders((await getOrdersForRouting({produsers: selectProdusers.map(element=>element._id), clients: clients, dateDelivery:dateDelivery})).invoicesForRouting)
                await showLoad(false)
            }
        })()
    },[selectProdusers, provider, selectDistricts, dateDelivery])
    useEffect(()=>{
        (async ()=>{
            let tonnage = 0;
            let size = 0;
            let price = 0;
            let returnedPrice = 0;
            for(let i=0; i<selectedOrders.length; i++){
                if (selectedOrders[i].allPrice)
                    price += selectedOrders[i].allPrice
                if (selectedOrders[i].returnedPrice)
                    returnedPrice += selectedOrders[i].returnedPrice
                if (selectedOrders[i].allSize)
                    size += selectedOrders[i].allSize
                if (selectedOrders[i].allTonnage)
                    tonnage += selectedOrders[i].allTonnage
            }
            setAllPrice(checkFloat(price))
            setAllSize(checkFloat(size))
            setAllTonnage(checkFloat(tonnage))
            setAllReturnedPrice(checkFloat(returnedPrice))
        })()
    },[selectedOrders])
    return (
        <App checkPagination={checkPagination} pageName={router.query.id==='new'?'Добавить':data.route?data.route.number:'Ничего не найдено'}>
            <Head>
                <title>{router.query.id==='new'?'Добавить':data.route?data.route.number:'Ничего не найдено'}</title>
                <meta name='description' content='Азык – это онлайн платформа для заказа товаров оптом, разработанная специально для малого и среднего бизнеса.  Она объединяет производителей и торговые точки напрямую, сокращая расходы и повышая продажи. Азык предоставляет своим пользователям мощные технологии для масштабирования и развития своего бизнеса.' />
                <meta property='og:title' content={router.query.id==='new'?'Добавить':data.route?data.route.number:'Ничего не найдено'} />
                <meta property='og:description' content='Азык – это онлайн платформа для заказа товаров оптом, разработанная специально для малого и среднего бизнеса.  Она объединяет производителей и торговые точки напрямую, сокращая расходы и повышая продажи. Азык предоставляет своим пользователям мощные технологии для масштабирования и развития своего бизнеса.' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/route/${router.query.id}`} />
                <link rel='canonical' href={`${urlMain}/route/${router.query.id}`}/>
                <link rel='stylesheet' href='https://unpkg.com/leaflet@1.2.0/dist/leaflet.css' />
                <link rel='stylesheet' href='https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css' />
                <link rel='stylesheet' href='https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css' />
            </Head>
            {
                router.query.id==='new'||data.route?
                    <>
                    <Card className={isMobileApp?classes.pageM:classes.pageD}>
                        <CardContent className={classes.column}>
                            <div style={{ justifyContent: 'center' }} className={classes.row}>
                                <div style={{background: screen==='setting'?'#004C3F':'#ffffff'}} onClick={()=>{setPagination(100);setScreen('setting')}} className={classes.selectType}>
                                    Настройки
                                </div>
                                <div style={{background: screen==='invoices'?'#004C3F':'#ffffff'}} onClick={()=>{setPagination(100);setScreen('invoices')}} className={classes.selectType}>
                                    Заказы {selectedOrders.length}/{orders.length}
                                </div>
                            </div>
                            {
                                screen==='setting'?
                                    <>
                                    <div className={classes.row}>
                                        <Autocomplete
                                            className={classes.inputHalf}
                                            options={data.organizations}
                                            getOptionLabel={option => option.name}
                                            value={provider}
                                            onChange={(event, newValue) => {
                                                handleProvider(newValue)
                                            }}
                                            disabled={router.query.id!=='new'}
                                            noOptionsText='Ничего не найдено'
                                            renderInput={params => (
                                                <TextField {...params} label='Поставщик' variant='outlined' fullWidth />
                                            )}
                                        />
                                        <FormControl className={classes.inputHalf} variant='outlined'>
                                            <InputLabel>Производители</InputLabel>
                                            <Select
                                                disabled={router.query.id!=='new'}
                                                multiple
                                                value={selectProdusers}
                                                onChange={handleSelectProdusers}
                                                input={<Input />}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 226,
                                                            width: 250,
                                                        },
                                                    }
                                                }}
                                            >
                                                {produsers.map((organization) => (
                                                    <MenuItem key={organization.name} value={organization}>
                                                        {organization.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <div className={classes.row}>
                                        <Autocomplete
                                            className={classes.inputHalf}
                                            disabled={router.query.id!=='new'}
                                            options={ecspeditors}
                                            value={selectEcspeditor}
                                            getOptionLabel={option => option.name}
                                            onChange={(event, newValue) => {
                                                setSelectEcspeditor(newValue)
                                            }}
                                            noOptionsText='Ничего не найдено'
                                            renderInput={params => (
                                                <TextField {...params} label='Экспедитор' variant='outlined' fullWidth />
                                            )}
                                        />
                                        <Autocomplete
                                            className={classes.inputHalf}
                                            disabled={router.query.id!=='new'}
                                            options={autos}
                                            value={selectAuto}
                                            getOptionLabel={option => option.number}
                                            onChange={(event, newValue) => {
                                                setSelectAuto(newValue)
                                            }}
                                            noOptionsText='Ничего не найдено'
                                            renderInput={params => (
                                                <TextField {...params} label='Транспорт' variant='outlined' fullWidth />
                                            )}
                                        />
                                    </div>
                                    <div className={classes.row}>
                                        <FormControl
                                            className={classes.inputThird}
                                            variant='outlined'>
                                            <InputLabel>Районы</InputLabel>
                                            <Select
                                                multiple
                                                disabled={router.query.id!=='new'}
                                                value={selectDistricts}
                                                onChange={handleSelectDistricts}
                                                input={<Input />}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 226,
                                                            width: 250,
                                                        },
                                                    }
                                                }}
                                            >
                                                {districts.map((district) => (
                                                    <MenuItem key={district.name} value={district}>
                                                        {district.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            className={classes.inputThird}
                                            label='Развозка'
                                            disabled={router.query.id!=='new'}
                                            type='date'
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            value={dateDelivery}
                                            format='MM/dd/yy'
                                            onChange={ event => setDateDelivery(event.target.value) }
                                        />
                                        <TextField
                                            disabled={router.query.id!=='new'}
                                            type={ isMobileApp?'number':'text'}
                                            label='Максимально заказов'
                                            value={length}
                                            className={classes.inputThird}
                                            onChange={(event)=>{setLength(inputInt(event.target.value))}}
                                            inputProps={{
                                                'aria-label': 'description',
                                            }}
                                        />
                                    </div>
                                    <br/>
                                    {
                                        deliverys?deliverys.map((element, idx)=>
                                            <ExpansionPanel key={`рейс${idx}`}>
                                                <ExpansionPanelSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                >
                                                    <div className={classes.value}>
                                                        Рейс {idx+1}
                                                    </div>
                                                </ExpansionPanelSummary>
                                                <ExpansionPanelDetails>
                                                    <div className={classes.column}>
                                                        <div className={classes.row}>
                                                            <div className={classes.nameField}>
                                                                Заказов:&nbsp;
                                                            </div>
                                                            <div className={classes.value}>
                                                                {element.orders.length}
                                                            </div>
                                                        </div>
                                                        <div className={classes.row}>
                                                            <div className={classes.nameField}>
                                                                Сумма{element.orders.reduce((accumulator, element) => accumulator + element.returnedPrice, 0)?' (факт/итого)':''}:&nbsp;
                                                            </div>
                                                            <div className={classes.value}>
                                                                {element.orders.reduce((accumulator, element) => accumulator + element.returnedPrice, 0)?`${checkFloat(element.orders.reduce((accumulator, element) => accumulator + element.allPrice-element.returnedPrice, 0)-element.orders.reduce((accumulator, element) => accumulator + element.returnedPrice, 0))} сом/`:''}{checkFloat(element.orders.reduce((accumulator, element) => accumulator + element.allPrice-element.returnedPrice, 0))} сом
                                                            </div>
                                                        </div>
                                                        <div className={classes.row}>
                                                            <div className={classes.nameField}>
                                                                Тоннаж:&nbsp;
                                                            </div>
                                                            <div className={classes.value}>
                                                                {element.tonnage} кг
                                                            </div>
                                                        </div>
                                                        <div className={classes.row}>
                                                            <div className={classes.nameField}>
                                                                Протяженость:&nbsp;
                                                            </div>
                                                            <div className={classes.value}>
                                                                {element.lengthInMeters/1000} км
                                                            </div>
                                                        </div>
                                                        <Button onClick={async()=>{
                                                            await showLoad(true)
                                                            window.open(((await getUnloadingInvoicesFromRouting({
                                                                organization: provider._id,
                                                                orders: element.orders.map(order=>order._id)
                                                            })).unloadingInvoicesFromRouting).data, '_blank');
                                                            await showLoad(false)
                                                        }} size='small' color='primary'>
                                                            Скачать накладные
                                                        </Button>
                                                        <Button onClick={async()=>{
                                                            let items = (await listDownload(element.orders.map(order=>order._id))).listDownload
                                                            setMiniDialog('Лист загрузки', <ItemList items={items}/>)
                                                            showMiniDialog(true)
                                                        }} size='small' color='primary'>
                                                            Лист загрузки
                                                        </Button>
                                                        {/*<Button onClick={async()=>{
                                                            let items = (await listUnload(element.orders.map(order=>order._id))).listUnload
                                                            setMiniDialog('Лист выгрузки', <ItemList items={items}/>)
                                                            showMiniDialog(true)
                                                        }} size='small' color='primary'>
                                                            Лист выгрузки
                                                        </Button>*/}
                                                        <Button onClick={async()=>{
                                                            setFullDialog('Список магазинов', <ListOrder
                                                                setList={(list)=>{deliverys[idx].orders = list; setDeliverys([...deliverys])}}
                                                                invoices={element.orders}
                                                            />)
                                                            showFullDialog(true)
                                                        }} size='small' color='primary'>
                                                            Список магазинов
                                                        </Button>
                                                        <Button onClick={async()=>{
                                                            setFullDialog('Маршрут', <GeoRoute legs={element.legs} setList={(list)=>{deliverys[idx].orders = list; setDeliverys([...deliverys])}} invoices={element.orders}/>)
                                                            showFullDialog(true)
                                                        }} size='small' color='primary'>
                                                            Карта
                                                        </Button>
                                                    </div>
                                                </ExpansionPanelDetails>
                                            </ExpansionPanel>
                                        ):null
                                    }
                                    <br/>
                                    </>
                                    :
                                    <div className={classes.listInvoices}>
                                        {orders?orders.map((element, idx)=> {
                                            if(idx<pagination)
                                                return(
                                                    <div key={element._id} style={isMobileApp ? {alignItems: 'baseline'} : {}}
                                                         className={isMobileApp ? classes.column1 : classes.row1}>
                                                        {
                                                            router.query.id==='new'?
                                                                <Checkbox checked={selectedOrders.findIndex(element1=>element1._id===element._id)!==-1}
                                                                          onChange={() => {
                                                                              if (selectedOrders.findIndex(element1=>element1._id===element._id)===-1) {
                                                                                  selectedOrders.push(element)
                                                                              } else {
                                                                                  selectedOrders.splice(selectedOrders.findIndex(element1=>element1._id===element._id), 1)
                                                                              }
                                                                              setSelectedOrders([...selectedOrders])
                                                                              setDeliverys([])
                                                                          }}
                                                                />
                                                                :
                                                                <IconButton
                                                                    onClick={()=>{
                                                                        deletedOrders.push(orders[idx])
                                                                        setDeletedOrders([...deletedOrders])
                                                                        orders.splice(idx, 1);
                                                                        setOrders([...orders])
                                                                    }}
                                                                    aria-label='toggle password visibility'
                                                                >
                                                                    <RemoveIcon/>
                                                                </IconButton>
                                                        }
                                                        <CardOrder setList={setOrders} list={orders} idx={idx} element={element}/>
                                                    </div>
                                                )}
                                        ):null}
                                    </div>
                            }
                        </CardContent>
                        {
                            router.query.id==='new'||deletedOrders.length?
                                <>
                                <Fab onClick={open} color='primary' aria-label='add' className={classes.fab}>
                                    <SettingsIcon />
                                </Fab>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={close}
                                    className={classes.menu}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                >
                                    {
                                        router.query.id==='new'?
                                            screen==='setting'?
                                                <>
                                                {
                                                    selectedOrders.length>0&&selectAuto&&selectAuto._id?
                                                        <MenuItem onClick={async()=>{
                                                            close()
                                                            await showLoad(true)
                                                            let tonnageError = selectedOrders.find(element=>element.allTonnage>selectAuto.tonnage)
                                                            if(!tonnageError) {
                                                                let geoError = selectedOrders.find(element=>!element.address[1])
                                                                if(!geoError) {
                                                                    let deliverys = (await buildRoute({
                                                                        provider: provider._id,
                                                                        autoTonnage: selectAuto.tonnage,
                                                                        length: checkInt(length),
                                                                        orders: selectedOrders.map(element => element._id)
                                                                    })).buildRoute
                                                                    let resultSelectedOrders = []
                                                                    for(let i=0; i<deliverys.length; i++){
                                                                        for(let i1=0; i1<deliverys[i].orders.length; i1++) {
                                                                            resultSelectedOrders.push(deliverys[i].orders[i1]._id)
                                                                        }
                                                                    }
                                                                    selectedOrders = selectedOrders.filter(element => resultSelectedOrders.includes(element._id))
                                                                    setSelectedOrders([...selectedOrders])
                                                                    setDeliverys(deliverys)
                                                                }
                                                                else
                                                                    showSnackBar(`Заказ №${geoError.number} отсуствует геолокация`)
                                                            }
                                                            else
                                                                showSnackBar(`Заказ №${tonnageError.number} слишком большой`)
                                                            await showLoad(false)
                                                        }}>Построить маршрут</MenuItem>
                                                        :
                                                        null
                                                }
                                                {
                                                    deliverys.length>0&&selectEcspeditor&&selectEcspeditor._id?
                                                        <MenuItem onClick={async()=>{
                                                            close()
                                                            await showLoad(true)
                                                            for(let i=0; i<deliverys.length; i++) {
                                                                deliverys[i].orders = deliverys[i].orders.map(element=>element._id)
                                                                deliverys[i] = {
                                                                    legs: deliverys[i].legs,
                                                                    orders: deliverys[i].orders,
                                                                    tonnage: deliverys[i].tonnage,
                                                                    lengthInMeters: deliverys[i].lengthInMeters
                                                                }
                                                            }
                                                            await addRoute({provider: provider._id, deliverys: deliverys, selectedOrders: selectedOrders.map(element=>element._id), selectDistricts: selectDistricts.map(element=>element._id), selectEcspeditor: selectEcspeditor._id, selectAuto: selectAuto._id, dateDelivery: dateDelivery, allTonnage: parseInt(allTonnage), selectProdusers: selectProdusers.map(element=>element._id)})
                                                            Router.push(`/routes/${provider._id}`)
                                                            await showLoad(false)
                                                        }}>Сохранить маршрут</MenuItem>
                                                        :
                                                        null
                                                }
                                                </>
                                                :
                                                <>
                                                {
                                                    orders.length>0?
                                                    <>
                                                    <MenuItem onClick={async()=>{
                                                        setSelectedOrders([...orders])
                                                        setDeliverys([])
                                                        close()
                                                    }}>Выбрать все</MenuItem>
                                                    <MenuItem onClick={async()=>{
                                                        setSelectedOrders([])
                                                        setDeliverys([])
                                                        close()
                                                    }}>Отменить выбор</MenuItem>
                                                    </>
                                                    :
                                                    null
                                                }
                                                <MenuItem onClick={async()=>{
                                                    setDeliverys([])
                                                    setFullDialog('Добавить заказ', <AddOrder districts={districts} produsers={produsers} dateDelivery={dateDelivery} mainSelectedOrders={selectedOrders} setMainSelectedOrders={setSelectedOrders} mainOrders={orders} setMainOrders={setOrders}/>)
                                                    showFullDialog(true)
                                                    close()
                                                }}>Добавить заказ</MenuItem>
                                                </>
                                            :
                                            <MenuItem onClick={async()=>{
                                                await showLoad(true)
                                                await setRoute({route: router.query.id, deletedOrders: deletedOrders.map(element=>element._id)})
                                                await showLoad(false)
                                                close()
                                            }}>
                                                Сохранить
                                            </MenuItem>

                                    }
                                </Menu>
                                </>
                                :
                                null
                        }
                    </Card>
                    {
                        selectedOrders&&selectedOrders.length?
                            <div className='count' onClick={()=>setShowStat(!showStat)}>
                                {
                                    `Заказов: ${selectedOrders.length}`
                                }
                                {
                                    showStat?
                                        <>
                                        {
                                            allPrice?
                                                <>
                                                <br/>
                                                <br/>
                                                {`Сумма${allReturnedPrice?' (факт./итого)':''}: ${allReturnedPrice?`${allPrice-allReturnedPrice}/${allPrice}`:allPrice} сом`}
                                                </>
                                                :
                                                null
                                        }
                                        {
                                            allTonnage?
                                                <>
                                                <br/>
                                                <br/>
                                                {`Тоннаж: ${allTonnage} кг`}
                                                </>
                                                :
                                                null
                                        }
                                        {
                                            allSize?
                                                <>
                                                <br/>
                                                <br/>
                                                {`Кубатура: ${allSize} см³`}
                                                </>
                                                :
                                                null
                                        }
                                        </>
                                        :
                                        null
                                }
                            </div>
                            :
                            null
                    }
                    </>
                    :
                    null
            }
        </App>
    )
})

Route.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(!['суперорганизация', 'организация', 'менеджер', 'admin', 'экспедитор', 'суперэкспедитор', 'агент'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
                Router.push('/contact')
    return {
        data: {
            route: (await getRoute({_id: ctx.query.id}, ctx.req?await getClientGqlSsr(ctx.req):undefined)).route,
            organizations: ctx.query.id==='new'?[...ctx.store.getState().user.profile.role==='admin'?[{name: 'ZAKAJI.KZ', _id: 'super'}]:[], ...(await getActiveOrganization('Бишкек', ctx.req?await getClientGqlSsr(ctx.req):undefined)).activeOrganization]:[]
        }
    };
};

function mapStateToProps (state) {
    return {
        app: state.app,
        user: state.user,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        mini_dialogActions: bindActionCreators(mini_dialogActions, dispatch),
        snackbarActions: bindActionCreators(snackbarActions, dispatch),
        appActions: bindActionCreators(appActions, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Route);