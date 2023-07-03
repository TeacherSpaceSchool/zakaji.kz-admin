import React, { useState } from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import cardEmploymentStyle from '../../src/styleMUI/employment/cardEmployment.js'
import { connect } from 'react-redux'
import Link from 'next/link';
import Button from '@material-ui/core/Button';
import CardActions from '@material-ui/core/CardActions';
import { bindActionCreators } from 'redux'
import * as mini_dialogActions from '../../redux/actions/mini_dialog'
import { onoffEmployment, deleteEmployment, restoreEmployment  } from '../../src/gql/employment'
import Confirmation from '../../components/dialog/Confirmation'

const CardEmployment = React.memo((props) => {
    const classes = cardEmploymentStyle();
    const { element, setList, list, idx } = props;
    const { isMobileApp } = props.app;
    const { profile } = props.user;
    const { setMiniDialog, showMiniDialog } = props.mini_dialogActions;
    let [status, setStatus] = useState(element!==undefined?element.user.status:'');
    return (
        <Card className={isMobileApp?classes.cardM:classes.cardD}>
            <Link href='/employment/[id]' as={`/employment/${element.user._id}`}>
                <CardActionArea>
                            <CardContent>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>
                                        Имя:&nbsp;
                                    </div>
                                    <div className={classes.value}>
                                        {element.name}
                                    </div>
                                </div>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>
                                        Телефон:&nbsp;
                                    </div>
                                    <div>
                                        {element.phone.map((phone, idx)=>
                                            idx<4?
                                                <div key={`phone${idx}`} className={classes.value}>
                                                    {phone}
                                                </div>
                                                :
                                                idx===4?
                                                    '...'
                                                    :
                                                    null
                                        )}
                                    </div>
                                </div>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>
                                        Организация:&nbsp;
                                    </div>
                                    <div className={classes.value}>
                                        {element.organization?element.organization.name:'ZAKAJI.KZ'}
                                    </div>
                                </div>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>
                                        Роль:&nbsp;
                                    </div>
                                    <div className={classes.value}>
                                        {element.user.role}
                                    </div>
                                </div>
                            </CardContent>
                        </CardActionArea>
            </Link>
            {
                element.del!=='deleted'&&(profile.role === 'admin' || ['суперорганизация', 'организация'].includes(profile.role)) && profile._id!==element.user._id ?
                    <CardActions>
                        <Button onClick={async()=>{
                            const action = async() => {
                                await onoffEmployment([element._id], element.organization._id)
                                setStatus(status==='active'?'deactive':'active')
                            }
                            setMiniDialog('Вы уверены?', <Confirmation action={action}/>)
                            showMiniDialog(true)
                        }} size='small'  color={status==='active'?'primary':'secondary'}>
                            {status==='active'?'Отключить':'Включить'}
                        </Button>
                        {
                            profile.role === 'admin'?
                                <Button onClick={async()=>{
                                    const action = async() => {
                                        await deleteEmployment([element._id])
                                        let _list = [...list]
                                        _list.splice(idx, 1)
                                        setList(_list)
                                    }
                                    setMiniDialog('Вы уверены?', <Confirmation action={action}/>)
                                    showMiniDialog(true)
                                }} size='small' color='secondary'>
                                    Удалить
                                </Button>
                                :
                                null
                        }
                    </CardActions>
                    :
                    null
            }
            {
                element.del==='deleted'?
                    <CardActions>
                        <Button onClick={async()=>{
                            const action = async() => {
                                await restoreEmployment([element._id])
                                let _list = [...list]
                                _list.splice(_list.indexOf(element), 1)
                                setList(_list)
                            }
                            setMiniDialog('Вы уверены?', <Confirmation action={action}/>)
                            showMiniDialog(true)
                        }} size='small' color='primary'>
                            Восстановить
                        </Button>
                    </CardActions>
                    :
                    null
            }
        </Card>
    );
})

function mapStateToProps (state) {
    return {
        app: state.app,
        user: state.user
    }
}

function mapDispatchToProps(dispatch) {
    return {
        mini_dialogActions: bindActionCreators(mini_dialogActions, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CardEmployment)