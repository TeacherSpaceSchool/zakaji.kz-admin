import Head from 'next/head';
import React, {useState, useEffect, useRef} from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import Router from 'next/router'
import { urlMain } from '../../redux/constants/other'
import initialApp from '../../src/initialApp'
import { getAgentMapGeos } from '../../src/gql/statistic'
import Fab from '@material-ui/core/Fab';
import ListIcon from '@material-ui/icons/FormatListNumbered';
import ClearIcon from '@material-ui/icons/Clear';
import { getAgents } from '../../src/gql/employment'
import { Map, YMaps, Placemark } from 'react-yandex-maps';
import CircularProgress from '@material-ui/core/CircularProgress';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { bindActionCreators } from 'redux'
import * as appActions from '../../redux/actions/app'
import * as mini_dialogActions from '../../redux/actions/mini_dialog'
import AgentMapGeoOrders from '../../components/dialog/AgentMapGeoOrders'
import { pdDatePicker } from '../../src/lib'
import pageListStyle from '../../src/styleMUI/file/fileList'
import { getGeoDistance } from '../../src/lib'

const AgentMapGeoStatistic = React.memo((props) => {

    const classes = pageListStyle();
    const { isMobileApp, city, date, organization } = props.app;
    const { profile } = props.user;
    const { showLoad } = props.appActions;
    const { setMiniDialog, showMiniDialog } = props.mini_dialogActions;
    const initialRender = useRef(true);
    let [load, setLoad] = useState(true);
    useEffect(()=>{
        if(process.browser){
            let appBody = document.getElementsByClassName('App-body')
            appBody[0].style.paddingBottom = '0px'
        }
    },[process.browser])
    let [agents, setAgents] = useState([]);
    let [agent, setAgent] = useState(null);
    let [index, setIndex] = useState(null);
    useEffect(()=>{
        (async()=>{
            if(organization) {
                setAgents((await getAgents({_id: organization})).agents)
                setAgent({_id: undefined})
            }
        })()
    },[organization])
    let [agentMapGeos, setAgentMapGeos] = useState(undefined);
    useEffect(()=>{
        (async()=>{
            if(agent&&agent._id) {
                await showLoad(true)
                setIndex(undefined)
                setAgentMapGeos((await getAgentMapGeos({agent: agent._id, date: date})).agentMapGeos)
                await showLoad(false)
            }
        })()
    },[agent, date])
    useEffect(()=>{
        (async()=>{
            if(initialRender.current) {
                initialRender.current = false;
            }
            else {
                await showLoad(true)
                setAgentMapGeos(undefined)
                setAgents([])
                await showLoad(false)
            }
        })()
    },[city])
    return (
        <>
        <YMaps>
            <App cityShow pageName='Карта посещений' dates organizations>
                <Head>
                    <title>Карта посещений</title>
                    <meta name='description' content='' />
                    <meta property='og:title' content='Карта посещений' />
                    <meta property='og:description' content='' />
                    <meta property='og:type' content='website' />
                    <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                    <meta property='og:url' content={`${urlMain}/statistic/agentmapgeo`} />
                    <link rel='canonical' href={`${urlMain}/statistic/agentmapgeo`}/>
                </Head>
                {
                    process.browser&&agentMapGeos?
                        <div style={{height: window.innerHeight-64, width: isMobileApp?window.innerWidth:window.innerWidth-300, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {
                                load?<CircularProgress/>:null
                            }
                            <div style={{display: load?'none':'block'}}>
                                <Map onLoad={()=>{setLoad(false)}} height={window.innerHeight-64} width={isMobileApp?window.innerWidth:window.innerWidth-300}
                                         state={{ center: index?agentMapGeos[index][1].split(', '):[43.252101, 76.9177063], zoom: index?15:12 }}
                                    >
                                    {agentMapGeos.map((address, idx)=> {
                                        if(!index||index===idx||(index-1)===idx)
                                            return <Placemark
                                                onClick={()=>{
                                                    if((idx+1)%2===0)
                                                        setIndex(idx)
                                                    else
                                                        setIndex(idx+1)
                                                }}
                                                key={`address${idx}`}
                                                options={{
                                                    draggable: false,
                                                    iconColor: address[2]
                                                }}
                                                properties={{iconCaption: address[0]}}
                                                geometry={address[1].split(', ')}/>
                                        }
                                    )}
                                </Map>
                            </div>
                        </div>
                        :
                        null
                }
            </App>
        </YMaps>
        {
            agents.length?
                <Autocomplete
                    style={{width: 250, position: 'fixed', top: 74, right: 10, padding: 10, borderRadius: 5, boxShadow: '0 0 10px rgba(0,0,0,0.5)', background: '#fff'}}
                    options={agents}
                    getOptionLabel={option => option.name}
                    value={agent}
                    onChange={(event, newValue) => {
                        setAgent(newValue)
                    }}
                    noOptionsText='Ничего не найдено'
                    renderInput={params => (
                        <TextField {...params} label='Агент' fullWidth />
                    )}
                />
                :
                null
        }
        {
            agentMapGeos?
                <>
                <div className='count'>
                    {`Заказов: ${agentMapGeos.length/2}`}
                </div>
                <Fab color={index!=undefined?'secondary':'primary'} aria-label='add' className={classes.fab} onClick={()=> {
                    if (index != undefined) {
                        setIndex(undefined)
                    }
                    else {
                        let orders = []
                        for (let i = 0; i < agentMapGeos.length; i++) {
                            if ((i + 1) % 2 === 0) {
                                orders.push([agentMapGeos[i][0], getGeoDistance(...(agentMapGeos[i-1][1].split(', ')), ...(agentMapGeos[i][1].split(', '))), i])
                            }
                        }
                        orders = orders.sort(function (a, b) {
                            return b[1] - a[1]
                        });
                        setMiniDialog(<AgentMapGeoOrders orders={orders} setIndexOrder={setIndex}/>)
                        showMiniDialog(true)
                    }
                }}>
                    {
                        index!=undefined?
                            <ClearIcon/>
                            :
                            <ListIcon/>

                    }
                </Fab>
                </>
                :null
        }
        </>
    )
})

AgentMapGeoStatistic.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(!['admin', 'суперорганизация'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    let date = new Date()
    if (date.getHours()<3)
        date.setDate(date.getDate() - 1)
    ctx.store.getState().app.date = pdDatePicker(date)
    ctx.store.getState().app.organization = ctx.store.getState().user.profile.organization
    return {};
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
        appActions: bindActionCreators(appActions, dispatch),

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AgentMapGeoStatistic);