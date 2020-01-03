import React, { Component } from 'react';
import { Icon, Form, Input, Button, Row, Col, Tag } from 'antd';
import { ROUTE_NAMES } from '../../common/RouteNames';
import Utils from '../../common/Utils';

import './login-base.css';

const FormItem = Form.Item;

class LoginForm extends Component {

  constructor(props) {
    super(props);
    let tenantName = 'AILA后台管理系统';
    if (this.props.tenant) {
      window.loginUrlPram = this.props.tenant;
      switch (this.props.tenant) {
        case 'hongyun' :
          tenantName = 'AILA后台管理系统';
          break;
        default:
      }
    }
    this.state = {
      getFieldDecorator: '',
      tagVisible: false,
      tagText: '提示信息',
      tableTitle: tenantName,
    };
    // console.log(this.props.tenant);
  }
  onClickTageClose = (e) => {
    e.preventDefault();
    this.setState({ tagVisible: false });
  };

  // 设置local
  setLocalStorage = (params) => {
    let usernameLocalArr = JSON.parse(window.localStorage.getItem('UnitedView_tenant'));
    if (usernameLocalArr && usernameLocalArr.includes(params.username)) return;
    if (!usernameLocalArr) {
      usernameLocalArr = [];
    }
    usernameLocalArr.push(params.username);
    window.localStorage.setItem('UnitedView_tenant', JSON.stringify(usernameLocalArr));
  };

  handlesubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        // Utils.router.go(`${ROUTE_NAMES.HOME}`);
        this.login({ ...values });
      }
    });
  };
  // 登录接口
  login = (params) => {
    console.log('params:', params);
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_user/api/login`,
      method: 'post',
      data: {
        ...params,
      },
      type: 'json',
    }).then((res) => {
      if (res.success) {
        window.sessionStorage.setItem('AILA_userInfo', JSON.stringify(res.data));

        console.log(JSON.stringify(res.data));
        // this.setLocalStorage(params);

        Utils.router.go(`${ROUTE_NAMES.HOME}`);
      } else {
        this.setState({
          tagVisible: true,
          tagText: res.message,
        });
      }
    }).catch(err => {
      console.log(err);
      if (!err.success) {
        this.setState({
          tagVisible: true,
          tagText: err.message,
        });
      }
    });
  };
  render() {
    const getFieldDecorator = this.props.form.getFieldDecorator;
    return (
      <div className="login-body">
        <section className="login-form">
          <Form onSubmit={this.handlesubmit} >
            <FormItem className="login-FormItem">
              <Row>
                <Col>
                  {getFieldDecorator('username', {
                    // initialValue: usernameLocal,
                    rules: [
                      { required: true, type: 'string', message: 'User name cannot be empty' }
                    ]
                  })(
                    <Input id="username" type="text" size="large" className="login-input" placeholder="User Name" addonBefore={<Icon type="user" />} />
                  )}
                </Col>
              </Row>
            </FormItem>
            <FormItem className="login-FormItem">
              <Row>
                <Col>
                  {getFieldDecorator('password', {
                    rules: [
                      { required: true, type: 'string', message: 'Password cannot be empty' },
                      // { validator: this.compareToFirstPassword, }
                    ]
                  })(
                    <Input id="password" type="password" size="large" placeholder="Password" className="login-input" addonBefore={<Icon type="lock" />} />
                  )}
                </Col>
              </Row>
            </FormItem>
            <FormItem className="login-FormItem" style={this.state.tagVisible ? { display: 'block' } : { display: 'none' }}>
              <Tag
                className="login-tag"
                closable
                color="#ff0000"
                // visible={this.state.tagVisible.toString()}
                onClose={this.onClickTageClose}
              >
                {this.state.tagText}
              </Tag>
            </FormItem>
            <FormItem className="login-FormItem">
              <Button type="primary" style={{ height: 50 }} htmlType="submit" className="login-btn">Login</Button>
            </FormItem>
          </Form>
        </section>
      </div>
    );
  }
}

const LoginBase = Form.create()(LoginForm);
export default LoginBase;

