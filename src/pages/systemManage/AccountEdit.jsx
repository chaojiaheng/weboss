import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Select } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;

//  0-未审核 Unaudited ，1-审核通过 Confirm，2-审核未通过 Refused
const statusList = [
  { label: 'Unaudited', value: 0 },
  { label: 'Confirm', value: 1 },
  { label: 'Refused', value: 2 },
];

class AccountEditComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showType: 'view', // view check
      checkTime: Utils.formatTime(1557197677),
      checkStatus: 1,
    };
    this.contentId = '';

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  // 获取详情
  getAPIInfo = () => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_demand/api/demand/info`,
      method: 'get',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        id: this.contentId,
      }
    })
      .then(res => {
        // console.log(res.data);
        this.setState({
          fileList: (res.data && res.data[0].attachments) ? res.data[0].attachments : [],
        });
      })
      .catch(() => {
      });
  };

  // 弹出框处理函数
  showModal = (showType, record) => {
    console.log(record);
    this.contentId = '';
    this.setState({
      modalVisible: true,
      showType,
    });

    if (record) {
      this.contentId = record.id;
      this.getAPIInfo();
      const tmpValue = {
        company_name_en: record.company_name_en,
        country_name: record.country_name,
        city_name: record.city_name,
      };
      setTimeout(() => {
        this.props.form.setFieldsValue(tmpValue);
      }, 200);
    }
  };
  modalCancel = () => {
    this.setState({
      modalVisible: false,
    });
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
        // 修改
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/save`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            comments: values.comments,
            id: this.contentId,
          }
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
      }
    });
  };

  render() {
    const { modalVisible, confirmLoading, showType } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
    };

    return (
      <div>
        <Modal
          title={showType === 'check' ? 'Check Picture' : 'Picture Information'}
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          confirmLoading={confirmLoading}
          destroyOnClose
          width="720px"
        >
          <div className="userformBox">
            <Form>
              <FormItem
                {...formItemLayout}
                label="Account"
              >
                {getFieldDecorator('company_name_en', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Email"
              >
                {getFieldDecorator('email', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Password"
              >
                {getFieldDecorator('password', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input />
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
                label="Confirm password"
              >
                {getFieldDecorator('confirmPassword', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Role"
              >
                {getFieldDecorator('role', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Select
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    { statusList.map(item => (
                      <Option key={item.value} value={item.value}>{item.label}</Option>
                    )) }
                  </Select>
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
                label="部门"
              >
                {getFieldDecorator('role1', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Select
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    { statusList.map(item => (
                      <Option key={item.value} value={item.value}>{item.label}</Option>
                    )) }
                  </Select>
                )}
              </FormItem>
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
AccountEditComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const AccountEdit = Form.create()(AccountEditComponent);
export default AccountEdit;
