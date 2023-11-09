import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import cardReturnedStyle from '../../src/styleMUI/returned/cardReturned'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as mini_dialogActions from '../../redux/actions/mini_dialog'
import { pdDDMMYYHHMM, pdDDMMYYYYWW } from '../../src/lib'
import Returned from '../dialog/Returned'
import Confirmation from '../../components/dialog/Confirmation'
import { deleteReturneds, restoreReturneds } from '../../src/gql/returned'
import SyncOn from '@material-ui/icons/Sync';
import SyncOff from '@material-ui/icons/SyncDisabled';

const CardReturned = React.memo((props) => {
    const classes = cardReturnedStyle();
    const { element, setList, setSelected, selected, list, idx } = props;
    const { setMiniDialog, showMiniDialog } = props.mini_dialogActions;
    const { profile, authenticated} = props.user;
    const { isMobileApp} = props.app;
    const statusColor = {
        'обработка': 'orange',
        'принят': 'green',
        'отмена': 'red'
    }
    const status = element.cancelForwarder?'отмена':element.confirmationForwarder?'принят':'обработка'
    return (
        <Card className={isMobileApp?classes.cardM:classes.cardD}>
        {
                ['admin', 'суперорганизация', 'организация', 'суперагент', 'агент', 'менеджер'].includes(profile.role)?
                    [1,2].includes(element.sync)?
                        <SyncOn style={{color: element.sync===1?'orange':'green'}} className={classes.sync}/>
                        :
                        <SyncOff color='secondary' className={classes.sync}/>
                    :
                    null
            }
            <CardActionArea onClick={()=>{
                if(!selected.length){setMiniDialog('Возврат', <Returned idx={idx} list={list} element={element} setList={setList}/>); showMiniDialog(true)}
                else {
                    if(element.cancelForwarder) {
                        if (selected.includes(element._id)) {
                            let _selected = selected.filter((i) => i !== element._id)
                            setSelected([..._selected])
                        }
                        else
                            setSelected([...selected, element._id])
                    }
                }
            }}>
                <CardContent className={classes.column}>
                    <div className={classes.row}>
                        <div className={classes.number}>{element.number}</div>&nbsp;
                        <div className={classes.status} style={{background: statusColor[status]}}>{
                            status
                        }</div>
                    </div>
                    <div className={classes.row}>
                        <div className={classes.nameField}>Время возврата:&nbsp;</div>
                        <div className={classes.value}>{pdDDMMYYHHMM(element.createdAt)}</div>
                    </div>
                    {
                        element.dateDelivery?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Дата доставки:&nbsp;</div>
                                <div className={classes.value}>{pdDDMMYYYYWW(element.dateDelivery)}</div>
                            </div>
                            :
                            null

                    }
                    {
                        ['admin', 'суперорганизация', 'организация', 'менеджер'].includes(profile.role)&&element.updatedAt!==element.createdAt?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Изменен:&nbsp;</div>
                                <div className={classes.value} style={{whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{`${pdDDMMYYHHMM(element.updatedAt)}${element.editor?`, ${element.editor}`:''}`}</div>
                            </div>
                            :
                            null
                    }
                    {
                        ['агент', 'суперорганизация', 'организация', 'менеджер', 'admin'].includes(profile.role)&&element.district?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Район:&nbsp;</div>
                                <div className={classes.value}>{element.district}</div>
                            </div>
                            :
                            null
                    }
                    {
                        element.agent&&element.agent.name?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Агент:&nbsp;</div>
                                <div className={classes.value}>{element.agent.name}</div>
                            </div>
                            :
                            null
                    }
                    {
                        element.forwarder&&element.forwarder.name?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Экспедитор:&nbsp;</div>
                                <div className={classes.value}>{`${element.forwarder.name}, р${element.track}`}</div>
                            </div>
                            :
                            null
                    }
                    <div className={classes.row}>
                        <div className={classes.nameField}>Адрес:&nbsp;</div>
                        <div className={classes.value}>{`${element.address[2]?`${element.address[2]}, `:''}${element.address[0]}${element.city?` (${element.city})`:''}`}</div>
                    </div>
                    <div className={classes.row}>
                        <div className={classes.nameField}>Клиент:&nbsp;</div>
                        <div className={classes.value}>{element.client.name}</div>
                    </div>
                    <div className={classes.row}>
                        <div className={classes.nameField}>Производитель:&nbsp;</div>
                        <div className={classes.value}>{element.organization.name}</div>
                    </div>
                    {
                        element.sale&&element.sale.name?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Дистрибьютор: &nbsp;</div>
                                <div className={classes.value}>{element.sale.name}</div>
                            </div>
                            :
                            null
                    }
                    {
                        element.provider&&element.provider.name?
                            <div className={classes.row}>
                                <div className={classes.nameField}>Поставщик: &nbsp;</div>
                                <div className={classes.value}>{element.provider.name}</div>
                            </div>
                            :
                            null
                    }
                    <div className={classes.row}>
                        <div className={classes.nameField}>Сумма: &nbsp;</div>
                        <div className={classes.value}>{`${element.allPrice} тенге`}</div>
                    </div>
                    {
                        authenticated&&profile.role!=='client'?
                            <>
                            {
                                element.allTonnage?
                                    <div className={classes.row}>
                                        <div className={classes.nameField}>Тоннаж:&nbsp;</div>
                                        <div className={classes.value}>{element.allTonnage}&nbsp;кг</div>
                                    </div>
                                    :
                                    null
                            }
                            {
                                element.allSize?
                                    <div className={classes.row}>
                                        <div className={classes.nameField}>Кубатура:&nbsp;</div>
                                        <div className={classes.value}>{element.allSize}&nbsp;см³</div>
                                    </div>
                                    :
                                    null
                            }
                            </>
                        :
                            null
                    }
                </CardContent>
            </CardActionArea>
            <CardActions>
                {
                    element.del!=='deleted'&&status==='отмена'&&profile.role==='admin'&&!selected.length ?
                        <Button onClick={async()=>{
                            const action = async() => {
                                await deleteReturneds([element._id])
                                let _list = [...list]
                                _list.splice(_list.indexOf(element), 1)
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
                {
                    element.del==='deleted'&&profile.role==='admin'?
                        <Button onClick={async()=>{
                            const action = async() => {
                                await restoreReturneds([element._id])
                                let _list = [...list]
                                _list.splice(_list.indexOf(element), 1)
                                setList(_list)
                            }
                            setMiniDialog('Вы уверены?', <Confirmation action={action}/>)
                            showMiniDialog(true)
                        }} size='small' color='primary'>
                            Восстановить
                        </Button>
                        :
                        null
                }
            </CardActions>
        </Card>
    );
})

function mapStateToProps (state) {
    return {
        user: state.user,
        app: state.app
    }
}

function mapDispatchToProps(dispatch) {
    return {
        mini_dialogActions: bindActionCreators(mini_dialogActions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CardReturned)