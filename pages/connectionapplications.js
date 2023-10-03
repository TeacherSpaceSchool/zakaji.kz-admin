import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import App from '../layouts/App';
import { connect } from 'react-redux'
import { getConnectionApplications, getConnectionApplicationsSimpleStatistic } from '../src/gql/connectionApplication'
import pageListStyle from '../src/styleMUI/connectionApplication/connectionApplicationList'
import CardConnectionApplications from '../components/connectionApplication/CardConnectionApplication'
import { urlMain } from '../redux/constants/other'
import LazyLoad from 'react-lazyload';
import { forceCheck } from 'react-lazyload';
import CardConnectionApplicationsPlaceholder from '../components/connectionApplication/CardConnectionApplicationPlaceholder'
import { getClientGqlSsr } from '../src/getClientGQL'
import initialApp from '../src/initialApp'
import Router from 'next/router'

const ConnectionApplications = React.memo((props) => {
    const classes = pageListStyle();
    const { profile } = props.user;
    const { data } = props;
    let [list, setList] = useState(data.connectionApplications);
    let [simpleStatistic, setSimpleStatistic] = useState(data.connectionApplicationsSimpleStatistic);
    const { filter } = props.app;
    let height = 189
    let [paginationWork, setPaginationWork] = useState(true);
    const checkPagination = async()=>{
        if(paginationWork){
            let addedList = (await getConnectionApplications({filter: filter, skip: list.length})).connectionApplications
            if(addedList.length>0){
                setList([...list, ...addedList])
            }
            else
                setPaginationWork(false)
        }
    }
    const getList = async()=>{
        setList((await getConnectionApplications({filter: filter, skip: 0})).connectionApplications)
        setSimpleStatistic((await getConnectionApplicationsSimpleStatistic({filter: filter})).connectionApplicationsSimpleStatistic)
        setPaginationWork(true);
        (document.getElementsByClassName('App-body'))[0].scroll({top: 0, left: 0, behavior: 'instant' });
        forceCheck()
    }
    useEffect(()=>{
        (async () => {
            await getList()
        })()
    },[filter])
    return (
        <App checkPagination={checkPagination} setList={setList} list={list} filters={data.filterConnectionApplication} pageName='Заявка на подключение'>
            <Head>
                <title>Заявка на подключение</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Заявка на подключение' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/connectionapplications`} />
                <link rel='canonical' href={`${urlMain}/connectionapplications`}/>
            </Head>
            <div className={classes.page}>
                {
                    !profile.role?
                        <CardConnectionApplications list={list} setList={setList}/>
                        :
                        null
                }
                {
                    list?list.map((element, idx)=> {
                            return(
                                <LazyLoad scrollContainer={'.App-body'} key={element._id} height={height} offset={[height, 0]} debounce={0} once={true}  placeholder={<CardConnectionApplicationsPlaceholder height={height}/>}>
                                    <CardConnectionApplications list={list} idx={idx} element={element} setList={setList}/>
                                </LazyLoad>
                            )}
                    ):null
                }
            </div>
            {
                profile.role==='admin'?
                    <div className='count'>
                        {`Всего: ${simpleStatistic}`}
                    </div>
                    :
                    null
            }
        </App>
    )
})

ConnectionApplications.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(ctx.store.getState().user.profile.role&&'admin'!==ctx.store.getState().user.profile.role)
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: {
            ...await getConnectionApplications({skip: 0, filter: ''}, ctx.req?await getClientGqlSsr(ctx.req):undefined),
            ...await getConnectionApplicationsSimpleStatistic({filter: ''}, ctx.req?await getClientGqlSsr(ctx.req):undefined),
        }
    };
};

function mapStateToProps (state) {
    return {
        app: state.app,
        user: state.user,
    }
}

export default connect(mapStateToProps)(ConnectionApplications);