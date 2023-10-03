import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import App from '../../layouts/App';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as userActions from '../../redux/actions/user'
import { getSubscribers } from '../../src/gql/subscriber'
import pageListStyle from '../../src/styleMUI/subscriber/subscriberList'
import CardSubscriber from '../../components/subscriber/CardSubscriber'
import { urlMain } from '../../redux/constants/other'
import LazyLoad from 'react-lazyload';
import CardSubscriberPlaceholder from '../../components/subscriber/CardSubscriberPlaceholder'
import { getClientGqlSsr } from '../../src/getClientGQL'
import initialApp from '../../src/initialApp'
import Router from 'next/router'

const Subscriber = React.memo((props) => {
    const classes = pageListStyle();
    const { data } = props;
    let [list, setList] = useState(data.subscribers);
    let [failed, setFailed] = useState(0);
    let [delivered, setDelivered] = useState(0);
    let height = 214
    useEffect(()=>{
        for(let i=0; i<data.subscribers.length; i++){
            if(data.subscribers[i].status==='доставлено')
                delivered+=1
            else
                failed+=1
        }
        setFailed(failed)
        setDelivered(delivered)
    })

    let [showStat, setShowStat] = useState(false);
    let [pagination, setPagination] = useState(100);
    const checkPagination = ()=>{
        if(pagination<list.length){
            setPagination(pagination+100)
        }
    }
    return (
        <App searchShow={true} checkPagination={checkPagination} pageName='Подписчики'>
            <Head>
                <title>Подписчики</title>
                <meta name='description' content='' />
                <meta property='og:title' content='Подписчики' />
                <meta property='og:description' content='' />
                <meta property='og:type' content='website' />
                <meta property='og:image' content={`${urlMain}/static/512x512.png`} />
                <meta property='og:image:width' content='512' />
                <meta property='og:image:height' content='512' />
                <meta property='og:url' content={`${urlMain}/statistic/subscriber`} />
                <link rel='canonical' href={`${urlMain}/statistic/subscriber`}/>
            </Head>
            <div className='count' onClick={()=>setShowStat(!showStat)}>
                {`Всего: ${list.length}`}
                {
                    showStat?
                        <>
                        <br/>
                        <br/>
                        {`Доставлено: ${delivered}`}
                        <br/>
                        <br/>
                        {`Провалено: ${failed}`}
                        </>
                        :
                        null
                }
            </div>
            <div className={classes.page}>
                {list?list.map((element, idx)=> {
                        if(idx<pagination)
                            return(
                                <LazyLoad scrollContainer={'.App-body'} key={element._id} height={height} offset={[height, 0]} debounce={0} once={true}  placeholder={<CardSubscriberPlaceholder height={height}/>}>
                                    <CardSubscriber key={element._id} setList={setList} element={element}/>
                                </LazyLoad>
                            )}
                ):null}
            </div>
        </App>
    )
})

Subscriber.getInitialProps = async function(ctx) {
    await initialApp(ctx)
    if(ctx.store.getState().user.profile.role!=='admin')
        if(ctx.res) {
            ctx.res.writeHead(302, {
                Location: '/contact'
            })
            ctx.res.end()
        } else
            Router.push('/contact')
    return {
        data: await getSubscribers(ctx.req?await getClientGqlSsr(ctx.req):undefined)
    };
};

function mapStateToProps (state) {
    return {
        user: state.user,
        app: state.app,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        userActions: bindActionCreators(userActions, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Subscriber);