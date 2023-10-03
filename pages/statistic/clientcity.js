import Head from 'next/head';
import React, { useEffect } from 'react';
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
import { getStatisticClientCity } from '../../src/gql/statistic'
import { bindActionCreators } from 'redux'
import * as appActions from '../../redux/actions/app'

const ClientCity = React.memo((props) => {

    const classes = pageListStyle();
    const { data } = props;
    const { isMobileApp } = props.app;
    useEffect(()=>{
        if(process.browser){
            let appBody = document.getElementsByClassName('App-body')
            appBody[0].style.paddingBottom = '0px'
        }
    },[process.browser])
    return (
        <App pageName='Клиентов в городах'>
            <Head>
                <title>Клиентов в городах</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Клиентов в городах' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/statistic/statisticstoragesize`} />
                <link rel='canonical' href={`${urlMain}/statistic/statisticstoragesize`}/>
            </Head>
            <Card className={classes.page}>
                <CardContent className={classes.column} style={isMobileApp?{}:{justifyContent: 'start', alignItems: 'flex-start'}}>
                    {
                        data.statisticClientCity?
                            <>
                            <Table type='item' row={(data.statisticClientCity.row).slice(1)} columns={data.statisticClientCity.columns}/>
                            <div className='count'>
                                <div className={classes.rowStatic}>{`Всего: ${data.statisticClientCity.row[0].data[0]} шт`}</div>
                            </div>
                            </>
                            :null
                    }
                </CardContent>
            </Card>
        </App>
    )
})

ClientCity.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    ctx.store.getState().app.filter = false
    if('admin'!==ctx.store.getState().user.profile.role)
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: {
            ...await getStatisticClientCity(ctx.req?await getClientGqlSsr(ctx.req):undefined)
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

export default connect(mapStateToProps, mapDispatchToProps)(ClientCity);