import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import { getOrganizations } from '../../src/gql/organization'
import pageListStyle from '../../src/styleMUI/organization/orgaizationsList'
import CardOrganization from '../../components/organization/CardOrganization'
import Link from 'next/link';
import { urlMain } from '../../redux/constants/other'
import LazyLoad from 'react-lazyload';
import CardOrganizationPlaceholder from '../../components/organization/CardOrganizationPlaceholder'
import { getClientGqlSsr } from '../../src/getClientGQL'
import initialApp from '../../src/initialApp'
import Router from 'next/router'
import { forceCheck } from 'react-lazyload';

const Integrates = React.memo((props) => {
    const classes = pageListStyle();
    const { data } = props;
    const { city } = props.app;
    let [list, setList] = useState(data.organizations);
    let height = 80
    let [pagination, setPagination] = useState(100);
    const initialRender = useRef(true);
    useEffect(()=>{
        (async()=>{
            if(initialRender.current) {
                initialRender.current = false;
            }
            else {
                setList((await getOrganizations({search: '', filter: '', city: city})).organizations)
            }
        })()
    },[city])
    useEffect(()=>{
        setPagination(100)
        forceCheck()
    },[list])
    const checkPagination = ()=>{
        if(pagination<list.length){
            setPagination(pagination+100)
        }
    }
    return (
        <App cityShow checkPagination={checkPagination} pageName='Принятая интеграции 1С'>
            <Head>
                <title>Принятая интеграции 1С</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Принятая интеграции 1С' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property="og:url" content={`${urlMain}/statistic/receivedatas`} />
                <link rel='canonical' href={`${urlMain}/statistic/receivedatas`}/>
            </Head>
            <div className='count'>
                {`Всего: ${list.length}`}
            </div>
            <div className={classes.page}>
                {list?list.map((element, idx)=> {
                    if(idx<pagination)
                        return(
                            <LazyLoad scrollContainer={'.App-body'} key={element._id} height={height} offset={[height, 0]} debounce={0} once={true}  placeholder={<CardOrganizationPlaceholder height={height}/>}>
                                <Link href='/statistic/receivedata/[id]' as={`/statistic/receivedata/${element._id}`}>
                                    <a>
                                        <CardOrganization key={element._id} setList={setList} element={element}/>
                                    </a>
                                </Link>
                            </LazyLoad>
                        )}
                ):null}
            </div>
        </App>
    )
})

Integrates.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(['суперорганизация', 'организация', 'менеджер'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: `/statistic/receivedata/${ctx.store.getState().user.profile.organization}`
            })
            ctx.res.end()
        } else
            Router.push(`/statistic/receivedata/${ctx.store.getState().user.profile.organization}`)
    if(!['admin'].includes(ctx.store.getState().user.profile.role))
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: {
            organizations:
                (await getOrganizations({city: ctx.store.getState().app.city, search: '', filter: ''}, ctx.req?await getClientGqlSsr(ctx.req):undefined)).organizations
        }
    };
};

function mapStateToProps (state) {
    return {
        app: state.app,
    }
}

export default connect(mapStateToProps)(Integrates);