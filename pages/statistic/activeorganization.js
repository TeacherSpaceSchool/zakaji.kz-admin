import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import pageListStyle from '../../src/styleMUI/statistic/statistic'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Router from 'next/router'
import { urlMain } from '../../redux/constants/other'
import initialApp from '../../src/initialApp'
import Table from '../../components/app/Table'
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { getStatisticOrganizationActivity, getActiveOrganization } from '../../src/gql/statistic'
import { getClientGqlSsr } from '../../src/getClientGQL'
import * as appActions from '../../redux/actions/app'
import { bindActionCreators } from 'redux'

const OrganizationStatisticActive = React.memo((props) => {
    const { data } = props;
    const classes = pageListStyle();
    const { isMobileApp, filter, city } = props.app;
    const { showLoad } = props.appActions;
    const { profile } = props.user;
    let [statisticActive, setStatisticActive] = useState(undefined);
    const initialRender = useRef(true);
    let [organization, setOrganization] = useState(undefined);
    let [activeOrganization, setActiveOrganization] = useState(data.activeOrganization);
    useEffect(()=>{
        (async()=>{
            await showLoad(true)
            setStatisticActive((await getStatisticOrganizationActivity({online: filter, city, ...(organization&&organization._id?{organization: organization._id}:{})}, undefined)).statisticOrganizationActivity)
            await showLoad(false)
        })()
    },[filter, organization, activeOrganization])
    useEffect(()=>{
        (async()=>{
            if(initialRender.current) {
                initialRender.current = false;
            }
            else {
                await showLoad(true)
                setOrganization(undefined)
                setActiveOrganization((await getActiveOrganization(city)).activeOrganization)
                await showLoad(false)
            }
        })()
    },[city])
    useEffect(()=>{
        if(process.browser){
            let appBody = document.getElementsByClassName('App-body')
            appBody[0].style.paddingBottom = '0px'
        }
    },[process.browser])
    let [showStat, setShowStat] = useState(false);
    const filters = [{name: 'Все', value: false}, {name: 'Online', value: true}]
    return (
        <App cityShow pageName='Активность организаций' filters={filters}>
            <Head>
                <title>Активность организаций</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Активность организаций' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/statistic/activeorganization`} />
                <link rel='canonical' href={`${urlMain}/statistic/activeorganization`}/>
            </Head>
            <Card className={classes.page}>
                <CardContent className={classes.column} style={isMobileApp?{}:{justifyContent: 'start', alignItems: 'flex-start'}}>
                    {
                        profile.role==='admin'?
                            <div className={classes.row}>
                                <Autocomplete
                                    className={classes.input}
                                    options={activeOrganization}
                                    getOptionLabel={option => option.name}
                                    value={organization}
                                    onChange={(event, newValue) => {
                                        setOrganization(newValue)
                                    }}
                                    noOptionsText='Ничего не найдено'
                                    renderInput={params => (
                                        <TextField {...params} label='Организация' fullWidth />
                                    )}
                                />
                            </div>
                            :
                            null
                    }
                    {
                        statisticActive?
                            <>
                            <Table type='client' row={statisticActive.row.slice(1)} columns={statisticActive.columns}/>
                            <div className='count' onClick={()=>setShowStat(!showStat)}>
                                <div className={classes.rowStatic}>{`Клиентов: ${statisticActive.row[0].data[0]}`}</div>
                                {
                                    showStat?
                                        <>
                                        <div className={classes.rowStatic}>{`Выполнено: ${statisticActive.row[0].data[1]} шт`}</div>
                                        <div className={classes.rowStatic}>{`Выручка: ${statisticActive.row[0].data[2]} сом`}</div>
                                        <div className={classes.rowStatic}>{`Отказов: ${statisticActive.row[0].data[3]} сом`}</div>
                                        <div className={classes.rowStatic}>{`Конс: ${statisticActive.row[0].data[4]} сом`}</div>
                                        </>
                                        :
                                        null
                                }
                            </div>
                            </>
                            :null
                    }

                </CardContent>
            </Card>
        </App>
    )
})

OrganizationStatisticActive.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    ctx.store.getState().app.filter = false
    if(!['admin', 'суперорганизация'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: {
            ...await getActiveOrganization(ctx.store.getState().app.city, ctx.req?await getClientGqlSsr(ctx.req):undefined),
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

        appActions: bindActionCreators(appActions, dispatch),

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(OrganizationStatisticActive);