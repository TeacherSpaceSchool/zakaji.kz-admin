import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import App from '../../layouts/App';
import CardRoute from '../../components/route/CardRoute'
import pageListStyle from '../../src/styleMUI/route/routeList'
import {getRoutes} from '../../src/gql/route'
import { connect } from 'react-redux'
import { urlMain } from '../../redux/constants/other'
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Link from 'next/link';
import Router from 'next/router'
import { getClientGqlSsr } from '../../src/getClientGQL'
const height = 210
import LazyLoad from 'react-lazyload';
import { forceCheck } from 'react-lazyload';
import CardRoutePlaceholder from '../../components/route/CardRoutePlaceholder'
import initialApp from '../../src/initialApp'
import { useRouter } from 'next/router'

const Routes = React.memo((props) => {
    const { profile } = props.user;
    const classes = pageListStyle();
    const initialRender = useRef(true);
    const router = useRouter()
    const { data } = props;
    let [list, setList] = useState(data.routes);
    let [paginationWork, setPaginationWork] = useState(true);
    const { search, filter, sort, date } = props.app;
    const checkPagination = async()=>{
        if(paginationWork){
            let addedList = (await getRoutes({organization: router.query.id, search: search, sort: sort, filter: filter, date: date, skip: list.length})).routes
            if(addedList.length>0){
                setList([...list, ...addedList])
            }
            else
                setPaginationWork(false)
        }
    }
    const getList = async ()=>{
        setList((await getRoutes({organization: router.query.id, search: search, sort: sort, filter: filter, date: date, skip: 0})).routes)
        forceCheck()
        setPaginationWork(true);
        (document.getElementsByClassName('App-body'))[0].scroll({top: 0, left: 0, behavior: 'instant' });
    }
    let [searchTimeOut, setSearchTimeOut] = useState(null);
    useEffect(()=>{
        (async ()=>{
            if(!initialRender.current) {
                await getList()
            }
        })()
    },[filter, sort, date])
    useEffect(()=>{
        (async ()=>{
            if(initialRender.current) {
                initialRender.current = false;
            } else {
                if(searchTimeOut)
                    clearTimeout(searchTimeOut)
                searchTimeOut = setTimeout(async()=>{
                    await getList()
                }, 500)
                setSearchTimeOut(searchTimeOut)
            }
        })()
    },[search])
    return (
        <App checkPagination={checkPagination} getList={getList} searchShow={true} dates={true} filters={data.filterRoute} sorts={data.sortRoute} pageName='Маршруты экспедитора'>
            <Head>
                <title>Маршруты экспедитора</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Маршруты экспедитора' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property="og:url" content={`${urlMain}/routes/${router.query.id}`} />
                <link rel='canonical' href={`${urlMain}/routes/${router.query.id}`}/>
            </Head>
            <div className='count'>
                {`Всего: ${list.length}`}
            </div>
            <div className={classes.page}>
                {list?list.map((element, idx)=> {
                    return(
                        <LazyLoad scrollContainer={'.App-body'} key={element._id} height={height} offset={[height, 0]} debounce={0} once={true}  placeholder={<CardRoutePlaceholder/>}>
                            <CardRoute list={list} idx={idx} setList={setList} key={element._id} element={element}/>
                        </LazyLoad>
                    )}
                ):null}
            </div>
            {['admin', 'организация', 'суперорганизация', 'агент', 'менеджер'].includes(profile.role)?
                <Link href='/route/[id]' as={`/route/new`}>
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

Routes.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(!['admin', 'организация', 'суперорганизация', 'менеджер', 'агент', 'экспедитор', 'суперэкспедитор'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: await getRoutes({organization: ctx.query.id, skip: 0, search: '', sort: '-createdAt', filter: '', date: ''}, ctx.req?await getClientGqlSsr(ctx.req):undefined)
    };
};

function mapStateToProps (state) {
    return {
        app: state.app,
        user: state.user,
    }
}

export default connect(mapStateToProps)(Routes);