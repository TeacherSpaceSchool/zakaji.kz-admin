import React, {useState} from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import cardAdsStyle from '../../src/styleMUI/notificationStatistic/cardNotificationStatistic'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button';
import CardActions from '@material-ui/core/CardActions';
import { addNotificationStatistic } from '../../src/gql/notificationStatistic'
import TextField from '@material-ui/core/TextField';
import { bindActionCreators } from 'redux'
import * as snackbarActions from '../../redux/actions/snackbar'
import {pdDDMMYYHHMM} from '../../src/lib'
import Confirmation from '../dialog/Confirmation'
import * as mini_dialogActions from '../../redux/actions/mini_dialog'


const NotificationStatistic = React.memo((props) => {
    const classes = cardAdsStyle();
    const { element, setList } = props;
    const { isMobileApp } = props.app;
    //addCard
    let [preview, setPreview] = useState(element?element.icon:'/static/add.png');
    let [icon, setIcon] = useState(undefined);
    let handleChangeIcon = ((event) => {
        if(event.target.files[0].size/1024/1024<50){
            setIcon(event.target.files[0])
            setPreview(URL.createObjectURL(event.target.files[0]))
        } else {
            showSnackBar('Файл слишком большой')
        }
    })
    let [title, setTitle] = useState(element?element.title:'');
    let handleTitle =  (event) => {
        setTitle(event.target.value)
    };
    let [text, setText] = useState(element?element.text:'');
    let handleText =  (event) => {
        setText(event.target.value)
    };
    let [tag, setTag] = useState(element?element.tag:'');
    let handleTag =  (event) => {
        setTag(event.target.value)
    };
    let [url, setUrl] = useState(element?element.url:'');
    let handleUrl =  (event) => {
        setUrl(event.target.value)
    };
    const { setMiniDialog, showMiniDialog } = props.mini_dialogActions;
    const { showSnackBar } = props.snackbarActions;
    return (
          <> {
                !element ?
                    <Card className={isMobileApp?classes.cardM:classes.cardD}>
                        <label htmlFor={element?element._id:'add'}>
                            <img
                                className={isMobileApp?classes.mediaM:classes.mediaD}
                                src={preview}
                                alt={'Изменить'}
                            />
                        </label>
                        <CardContent>
                                <TextField
                                    label='Заголовок'
                                    value={title}
                                    className={classes.input}
                                    onChange={handleTitle}
                                    inputProps={{
                                        'aria-label': 'description',
                                    }}
                                />
                            <br/>
                            <br/>
                            <TextField
                                label='Текст'
                                value={text}
                                className={classes.input}
                                onChange={handleText}
                                inputProps={{
                                    'aria-label': 'description',
                                }}
                            />
                            <br/>
                            <br/>
                            <TextField
                                label='Тэг(не обязательно)'
                                value={tag}
                                className={classes.input}
                                onChange={handleTag}
                                inputProps={{
                                    'aria-label': 'description',
                                }}
                            />
                            <br/>
                            <br/>
                            <TextField
                                label='URL(не обязательно)'
                                value={url}
                                className={classes.input}
                                onChange={handleUrl}
                                inputProps={{
                                    'aria-label': 'description',
                                }}
                            />
                            </CardContent>
                        <CardActions>
                            <Button onClick={async()=> {
                                if (text.length > 0 && title.length > 0) {
                                    setTitle('')
                                    setText('')
                                    setTag('')
                                    setUrl('')
                                    setPreview('/static/add.png')
                                    const action = async() => {
                                        let res = (await addNotificationStatistic({text: text, title: title, url: url, tag: tag, icon: icon})).notificationStatistics
                                        setList(res)
                                    }
                                    setMiniDialog('Вы уверены?', <Confirmation action={action}/>)
                                    showMiniDialog(true)
                                } else {
                                    showSnackBar('Заполните все поля')
                                }
                            }
                            } size='small' color='primary'>
                                Отправить
                            </Button>
                        </CardActions>
                        <input
                            accept='image/*'
                            style={{ display: 'none' }}
                            id={element?element._id:'add'}
                            type='file'
                            onChange={handleChangeIcon}
                        />
                    </Card>
                    :
                    <Card className={isMobileApp?classes.cardM:classes.cardD}>
                    {
                            element.icon?
                                <img
                                    className={isMobileApp?classes.mediaM:classes.mediaD}
                                    src={preview}
                                    alt={element.title}
                                />
                                :null
                        }
                        <CardContent>
                            <CardActionArea>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>Создан:&nbsp;</div>
                                    <div className={classes.value}>{pdDDMMYYHHMM(element.createdAt)}</div>
                                </div>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>Заголовок:&nbsp;</div>
                                    <div className={classes.value}>{element.title}</div>
                                </div>
                                <div className={classes.row}>
                                    <div className={classes.nameField}>Текст:&nbsp;</div>
                                    <div className={classes.value}>{element.text}</div>
                                </div>
                                {
                                    element.tag?
                                        <div className={classes.row}>
                                            <div className={classes.nameField}>Тэг:&nbsp;</div>
                                            <div className={classes.value}>{element.tag}</div>
                                        </div>
                                        :
                                        null
                                }
                                {
                                    element.url?
                                        <div className={classes.row}>
                                            <div className={classes.nameField}>URL:&nbsp;</div>
                                            <div className={classes.value}>{element.url}</div>
                                        </div>
                                        :
                                        null
                                }
                                <div className={classes.row}>
                                    <div className={classes.nameField}>Доставлено:&nbsp;</div>
                                    <div className={classes.value}>{element.delivered}</div>
                                </div>
                                {
                                    element.click!=undefined?
                                        <div className={classes.row}>
                                            <div className={classes.nameField}>Кликов:&nbsp;</div>
                                            <div className={classes.value}>{element.click}</div>
                                        </div>
                                        :null
                                }
                                <div className={classes.row}>
                                    <div className={classes.nameField}>Провалено:&nbsp;</div>
                                    <div className={classes.value}>{element.failed}</div>
                                </div>
                            </CardActionArea>
                        </CardContent>
                    </Card>
            }</>
    );
})

function mapStateToProps (state) {
    return {
        app: state.app
    }
}

function mapDispatchToProps(dispatch) {
    return {
        snackbarActions: bindActionCreators(snackbarActions, dispatch),
        mini_dialogActions: bindActionCreators(mini_dialogActions, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationStatistic)