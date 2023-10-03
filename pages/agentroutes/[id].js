import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import App from '../../layouts/App';
import CardAgentRoute from '../../components/agentRoute/CardAgentRoute'
import pageListStyle from '../../src/styleMUI/agentRoute/agentRouteList'
import {getAgentRoutes} from '../../src/gql/agentRoute'
import { connect } from 'react-redux'
import { urlMain } from '../../redux/constants/other'
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Link from 'next/link';
import Router from 'next/router'
import { getClientGqlSsr } from '../../src/getClientGQL'
import { useRouter } from 'next/router'
import LazyLoad from 'react-lazyload';
import { forceCheck } from 'react-lazyload';
import CardAgentRoutePlaceholder from '../../components/agentRoute/CardAgentRoutePlaceholder'
import initialApp from '../../src/initialApp'
const height = 210;

const AgentRoutes = React.memo((props) => {
    const { profile } = props.user;
    const classes = pageListStyle();
    const router = useRouter()
    const { data } = props;
    let [list, setList] = useState(data.agentRoutes);
    const { search } = props.app;
    let [searchTimeOut, setSearchTimeOut] = useState(null);
    const initialRender = useRef(true);
    useEffect(()=>{
        (async()=>{
            if(initialRender.current) {
                initialRender.current = false;
            } else {
                if(searchTimeOut)
                    clearTimeout(searchTimeOut)
                searchTimeOut = setTimeout(async()=>{
                    setList((await getAgentRoutes({organization: router.query.id, search: search})).agentRoutes)
                    setPagination(100);
                    forceCheck();
                    (document.getElementsByClassName('App-body'))[0].scroll({top: 0, left: 0, behavior: 'instant' });
                }, 500)
                setSearchTimeOut(searchTimeOut)

            }
        })()
    },[search])
    let [pagination, setPagination] = useState(100);
    const checkPagination = ()=>{
        if(pagination<list.length){
            setPagination(pagination+100)
        }
    }
    return (
        <App checkPagination={checkPagination} searchShow={true} pageName='Маршруты агентов'>
            <Head>
                <title>Маршруты агентов</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Маршруты агентов' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:url' content={`${urlMain}/agentroutes/${router.query.id}`} />
                <link rel='canonical' href={`${urlMain}/agentroutes/${router.query.id}`}/>
            </Head>
            <div className='count'>
                {`Всего: ${list.length}`}
            </div>
            <div className={classes.page}>
                {list?list.map((element, idx)=> {
                    if(idx<pagination)
                        return(
                            <LazyLoad scrollContainer={'.App-body'} key={element._id} height={height} offset={[height, 0]} debounce={0} once={true}  placeholder={<CardAgentRoutePlaceholder/>}>
                                <CardAgentRoute list={list} idx={idx} setList={setList} key={element._id} element={element}/>
                            </LazyLoad>
                        )}
                ):null}
            </div>
            {['admin', 'суперорганизация', 'организация', 'менеджер'].includes(profile.role)?
                <Link href='/agentroute/[id]' as={`/agentroute/new`}>
                    <Fab color='primary' aria-label='add' className={classes.fab}>
                        <AddIcon />
                    </Fab>
                </Link>
                :
                null
            }
        </App>
    )
})

AgentRoutes.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(!['admin', 'суперорганизация', 'организация', 'менеджер'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: {
            ...(await getAgentRoutes({organization: ctx.query.id, search: ''}, ctx.req?await getClientGqlSsr(ctx.req):undefined))
            }
    };
};

function mapStateToProps (state) {
    return {
        app: state.app,
        user: state.user
    }
}

export default connect(mapStateToProps)(AgentRoutes);