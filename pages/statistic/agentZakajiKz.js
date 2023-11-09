import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import pageListStyle from '../../src/styleMUI/statistic/statistic'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Router from 'next/router'
import { urlMain } from '../../redux/constants/other'
import initialApp from '../../src/initialApp'
import Table from '../../components/app/Table'
import { getClientGqlSsr } from '../../src/getClientGQL'
import { pdDatePicker } from '../../src/lib'
import { getStatisticZakajiKzAgent } from '../../src/gql/statistic'
import { getAgents } from '../../src/gql/employment'
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { bindActionCreators } from 'redux'
import * as appActions from '../../redux/actions/app'

const ZakajiKzStatistic = React.memo((props) => {

    const classes = pageListStyle();
    const { data } = props;
    const { isMobileApp } = props.app;
    let [dateStart, setDateStart] = useState(data.dateStart);
    let [dateType, setDateType] = useState('day');
    let [statisticOrder, setStatisticOrder] = useState(undefined);
    let [showStat, setShowStat] = useState(false);
    let [agent, setAgent] = useState(undefined);
    const { showLoad } = props.appActions;
    useEffect(()=>{
        (async()=>{
            if(agent) {
                await showLoad(true)
                setStatisticOrder((await getStatisticZakajiKzAgent({
                    agent: agent._id,
                    dateStart: dateStart ? dateStart : null,
                    dateType: dateType,
                })).statisticZakajiKzAgent)
                await showLoad(false)
            }
        })()
    },[agent, dateStart, dateType])
    useEffect(()=>{
        if(process.browser){
            let appBody = document.getElementsByClassName('App-body')
            appBody[0].style.paddingBottom = '0px'
        }
    },[process.browser])
    return (
        <App pageName='Статистика агента ZAKAJI.KZ'>
            <Head>
                <title>Статистика агента ZAKAJI.KZ</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Статистика агента ZAKAJI.KZ' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/statistic/agentZakajiKz`} />
                <link rel='canonical' href={`${urlMain}/statistic/agentZakajiKz`}/>
            </Head>
            <Card className={classes.page}>
                <CardContent className={classes.column} style={isMobileApp?{}:{justifyContent: 'start', alignItems: 'flex-start'}}>
                    <div className={classes.row}>
                        <Button style={{width: 50, margin: 5}} variant='contained' onClick={()=>setDateType('day')} size='small' color={dateType==='day'?'primary':''}>
                            День
                        </Button>
                        <Button style={{width: 50, margin: 5}} variant='contained' onClick={()=>setDateType('week')} size='small' color={dateType==='week'?'primary':''}>
                            Неделя
                        </Button>
                        <Button style={{width: 50, margin: 5}} variant='contained' onClick={()=>setDateType('month')} size='small' color={dateType==='month'?'primary':''}>
                            Месяц
                        </Button>
                        <Button style={{width: 50, margin: 5}} variant='contained' onClick={()=>setDateType('year')} size='small' color={dateType==='year'?'primary':''}>
                            Год
                        </Button>
                    </div>
                    <div className={classes.row}>
                        <Autocomplete
                            className={classes.input}
                            options={data.agents}
                            getOptionLabel={option => option.name}
                            value={agent}
                            onChange={(event, newValue) => {
                                setAgent(newValue)
                            }}
                            noOptionsText='Ничего не найдено'
                            renderInput={params => (
                                <TextField {...params} label='агент' fullWidth/>
                            )}
                        />
                        <TextField
                            className={classes.input}
                            label='Дата начала'
                            type='date'
                            InputLabelProps={{
                                shrink: true,
                            }}
                            value={dateStart}
                            inputProps={{
                                'aria-label': 'description',
                            }}
                            onChange={ event => setDateStart(event.target.value) }
                        />
                    </div>
                    {
                        statisticOrder?
                            <Table type='item' row={(statisticOrder.row).slice(1)} columns={statisticOrder.columns}/>
                            :null
                    }
                </CardContent>
            </Card>
            <div className='count' onClick={()=>setShowStat(!showStat)}>
                {
                    statisticOrder?
                        <>
                        <div className={classes.rowStatic}>{`Компаний: ${statisticOrder.row[0].data[0]}`}</div>
                        {
                            showStat?
                                <>
                                <div className={classes.rowStatic}>{`Выручка: ${statisticOrder.row[0].data[1]} тенге`}</div>
                                <div className={classes.rowStatic}>{`Выполнено: ${statisticOrder.row[0].data[2]} шт`}</div>
                                <div className={classes.rowStatic}>{`Отказов: ${statisticOrder.row[0].data[3]} тенге`}</div>
                                <div className={classes.rowStatic}>{`Конс: ${statisticOrder.row[0].data[4]} тенге`}</div>
                                <div className={classes.rowStatic}>{`Прибыль: ${statisticOrder.row[0].data[5]} тенге`}</div>
                                </>
                                :
                                null
                        }
                        </>
                        :null
                }
            </div>
        </App>
    )
})

ZakajiKzStatistic.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(!['admin'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    let dateStart = new Date()
    if (dateStart.getHours()<3)
        dateStart.setDate(dateStart.getDate() - 1)
    return {
        data: {
            ...await getAgents({_id: 'super'}, ctx.req?await getClientGqlSsr(ctx.req):undefined),
            dateStart: pdDatePicker(dateStart)
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

export default connect(mapStateToProps, mapDispatchToProps)(ZakajiKzStatistic);