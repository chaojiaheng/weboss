import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Select, Button } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;

// 用户类型 '用户类型 1-主账号，2-子账号',
const companyUserTypeList = [
  { label: 'Main Account', value: 1 },
  { label: 'Sub Account', value: 2 },
];
// '账号状态 0-未激活，1-已激活',
const statusList = [
  { label: 'Unactivated', value: 0 },
  { label: 'Activated', value: 1 },
];

class MembersEditComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showType: 'view', // view check
      checkTime: Utils.formatTime(1557197677),
      checkStatus: 1,
      confirmDirty: false, // 确认密码是否一致
    };
    this.contentId = '';
    this.companyData = null;

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  // 获取详情
  getAPIInfo = () => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_user/api/user/info`,
      method: 'get',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        user_id: this.contentId,
      }
    })
      .then(res => {
        console.log(res.data);
        const tmpValue = {
          fullname: res.data.fullname,
          job_title: res.data.job_title,
          phone: res.data.phone,
        };
        this.props.form.setFieldsValue(tmpValue);
      })
      .catch(() => {
      });
  };

  // 弹出框处理函数
  showModal = (showType, record, companyData) => {
    console.log(record);
    this.contentId = '';
    this.setState({
      modalVisible: true,
      showType,
    });
    this.companyData = companyData;

    let tmpValue = {};
    if (record) {
      this.contentId = record.id;
      this.getAPIInfo();
      tmpValue = {
        company: record.company,
        username: record.username,
        type: record.type,
        status: record.status,
        email: record.email,
        created_time: Utils.formatTime(record.created_time),
      };
    } else {
      tmpValue = {
        company: this.companyData.name_en,
      };
    }
    setTimeout(() => {
      this.props.form.setFieldsValue(tmpValue);
    }, 200);
  };
  modalCancel = () => {
    this.setState({
      modalVisible: false,
    });
  };

  // 暂时不用
  validateToEmail = (rule, value, callback) => {
    // const form = this.props.form;
    console.log(this.state.confirmDirty);
    callback();
  };
  compareToFirstPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback('Two passwords that you enter is inconsistent!');
    } else {
      callback();
    }
  };
  validateToNextPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirmPassword'], { force: true });
    }
    callback();
  };
  handleConfirmBlur = (e) => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };


  // 提交接口
  handleSubmit = (e) => {
    console.log('handleSubmit');
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        this.setState({
          confirmLoading: true,
        });
        const tmpParam = { ...values };

        if (this.state.showType === 'add') {
          // 校验邮箱是否存在
          Utils.request({
            url: `${window.PAY_API_HOST}/baseapi/admin_user/api/check`,
            method: 'get',
            headers: {
              token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
            },
            data: {
              email: values.email,
            },
          })
            .then(res => {
              console.log(res);
              // res.data.exist true是存在，false是不存在
              if (res && res.success && res.data && !res.data.exist) {
                this.saveAPI(tmpParam);
              } else if (res && res.success && res.data && res.data.exist) {
                this.setState({
                  confirmLoading: false,
                });
                message.error(`Email "${values.email}" has been registered for use!`);
              }
            })
            .catch((res) => {
              console.log(res);
              this.setState({
                confirmLoading: false,
              });
              if (res && !res.success && res.message) {
                message.error(`${res.message}`);
                // message.error('Please enter the correct format of the email!');
              } else {
                message.error('Network connection failed, please contact the administrator!');
              }
            });
        } else {
          this.saveAPI(tmpParam);
        }
      }
    });
  };

  saveAPI = (tmpParam) => {
    delete tmpParam.company;
    if (this.state.showType === 'setMainAccount') {
      tmpParam = {
        user_id: this.contentId,
        type: companyUserTypeList[0].value,
      };
    } else if (this.state.showType !== 'add') {
      tmpParam.user_id = this.contentId;
    } else {
      tmpParam.company_id = this.companyData.id;
    }
    // 修改
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_user/api/user/save`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: tmpParam,
    })
      .then(res => {
        if (res && res.success) {
          this.setState({
            modalVisible: false,
            confirmLoading: false,
          });
          message.success('Success');
          this.props.onOK();
        }
      })
      .catch(() => {
        this.setState({
          modalVisible: false,
          confirmLoading: false,
        });
        message.error('Fail');
      });
  };

  render() {
    const { modalVisible, confirmLoading, showType } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    // const formItemLayoutRow = {
    //   labelCol: { span: 8 },
    //   wrapperCol: { span: 14 },
    // };
    let footerArr = [<Button key="back" onClick={this.modalCancel}>Cancel</Button>];
    if (showType !== 'view') {
      footerArr = [
        <Button key="back" onClick={this.modalCancel}>Cancel</Button>,
        <Button key="submit" type="primary" loading={confirmLoading} onClick={this.handleSubmit}>OK</Button>,
      ];
    }

    return (
      <div>
        <Modal
          title="Company User Information"
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          confirmLoading={confirmLoading}
          footer={footerArr}
          destroyOnClose
          width="960px"
        >
          <div className="userformBox">
            <Form>
              <FormItem
                {...formItemLayout}
                label="Company Name"
              >
                {getFieldDecorator('company', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Email"
                hasFeedback
              >
                {getFieldDecorator('email', {
                  rules: [
                    { type: 'email', message: 'The input is not valid E-mail!', },
                    { required: true, message: 'Please input your E-mail!', },
                    // { validator: this.validateToEmail }
                  ],
                })(
                  <Input disabled={(showType !== 'add')} />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="User Name"
              >
                {getFieldDecorator('username', {
                  // initialValue: this.props.id,
                })(
                  <Input disabled={(showType === 'view' || showType === 'setMainAccount')} />
                )}
              </FormItem>
              {
                (showType !== 'setMainAccount') &&
                <FormItem
                  {...formItemLayout}
                  label="Full Name"
                >
                  {getFieldDecorator('fullname', {
                    rules: [{ message: '' }],
                  })(
                    <Input disabled={(showType === 'view' || showType === 'setMainAccount')} />
                  )}
                </FormItem>
              }
              {
                (showType === 'view' || showType === 'edit') &&
                <FormItem
                  {...formItemLayout}
                  label="Type"
                >
                  {getFieldDecorator('type', {
                    // initialValue: this.props.id,
                  })(
                    <Select
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      disabled
                      // disabled={(showType === 'view' || showType === 'setMainAccount')}
                    >
                      { companyUserTypeList.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      )) }
                    </Select>
                  )}
                </FormItem>
              }
              {
                (showType === 'add') &&
                <div>
                  <FormItem
                    {...formItemLayout}
                    label="Password"
                  >
                    {getFieldDecorator('password', {
                      rules: [{
                        required: true, message: 'Please input your password!',
                      }, {
                        validator: this.validateToNextPassword,
                      }],
                    })(
                      <Input type="password" />
                    )}
                  </FormItem>
                  <FormItem
                    {...formItemLayout}
                    label="Confirm Password"
                  >
                    {getFieldDecorator('confirmPassword', {
                      rules: [{
                        required: true, message: 'Please confirm your password!',
                      }, {
                        validator: this.compareToFirstPassword,
                      }],
                    })(
                      <Input type="password" onBlur={this.handleConfirmBlur} />
                    )}
                  </FormItem>
                </div>
              }
              <FormItem
                {...formItemLayout}
                label="job title"
              >
                {getFieldDecorator('job_title', {
                  // rules: [{ required: true, message: '' }],
                })(
                  <Input disabled={(showType === 'view' || showType === 'setMainAccount')} />
                )}
              </FormItem>
              {/*
              {
                (showType !== 'setMainAccount') &&
                <FormItem
                  {...formItemLayout}
                  label="Role"
                >
                  {getFieldDecorator('role', {
                    rules: [{ message: '' }],
                  })(
                    <Input disabled={(showType === 'view' || showType === 'setMainAccount')} />
                  )}
                </FormItem>
              }
              {
                (showType !== 'setMainAccount') &&
                <FormItem
                  {...formItemLayout}
                  label="Sex"
                >
                  {getFieldDecorator('sex', {
                    // initialValue: this.props.id,
                  })(
                    <Select
                      disabled={(showType === 'view' || showType === 'setMainAccount')}
                    >
                      <Option value="0">men</Option>
                      <Option value="1">women</Option>
                    </Select>
                  )}
                </FormItem>
              }
              */}
              {
                (showType !== 'setMainAccount') &&
                <FormItem
                  {...formItemLayout}
                  label="Phone"
                >
                  {getFieldDecorator('phone', {
                    rules: [{ message: '' }],
                  })(
                    <Input disabled={(showType === 'view' || showType === 'setMainAccount')} />
                  )}
                </FormItem>
              }
              {
                (showType !== 'add') &&
                <div>
                  <FormItem
                    {...formItemLayout}
                    label="Create Time"
                  >
                    {getFieldDecorator('created_time', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                  <FormItem
                    {...formItemLayout}
                    label="Status"
                  >
                    {getFieldDecorator('status', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Select
                        showSearch
                        optionFilterProp="children"
                        allowClear
                        disabled={(showType === 'view' || showType === 'setMainAccount')}
                      >
                        { statusList.map(item => (
                          <Option key={item.value} value={item.value}>{item.label}</Option>
                        )) }
                      </Select>
                    )}
                  </FormItem>
                </div>
              }
              {/*
              <Row type="flex" justify="space-between">
                <Col span={12}>
                </Col>
                <Col span={12} >
                </Col>
              </Row>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                </Col>
                <Col span={12} >
                </Col>
              </Row>
              */}
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
MembersEditComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const MembersEdit = Form.create()(MembersEditComponent);
export default MembersEdit;
