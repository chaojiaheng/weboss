import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Select } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;

class AssociatedCompanyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      salesData: [],
    };
    this.contentId = '';

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
    this.getSalesList();
  }


  // 获取销售人员
  getSalesList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_user/api/user/list`,
      method: 'POST',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        // nopage: 1,
      }
    })
      .then(res => {
        const resData = res.data;
        this.setState({
          salesData: resData,
        });
      })
      .catch(() => {
      });
  };

  // 弹出框处理函数
  showModal = (record) => {
    console.log(record);
    this.contentId = '';
    this.setState({
      modalVisible: true,
    });

    if (record) {
      this.contentId = record.id;
      const tmpValue = {
        company_name_en: record.name_en,
        country_name_en: record.country_name_en,
        saler_id: this.AILA_userInfo.id,
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
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/sale_company/set`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            saler_id: values.saler_id,
            company_id: this.contentId,
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
    const { modalVisible, confirmLoading, salesData } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };

    return (
      <div>
        <Modal
          title="Audit Company"
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
                label="Company Name"
              >
                {getFieldDecorator('company_name_en', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Country"
              >
                {getFieldDecorator('country_name_en', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
                label="Sales"
              >
                {getFieldDecorator('saler_id', {
                  // initialValue: this.props.id,
                })(
                  <Select
                    showSearch
                    optionFilterProp="children"
                    disabled
                    // onChange={value => this.OnChangeAll(value, 'saler_id')}
                    // allowClear
                  >
                    {
                      salesData.map(item => (
                        <Option key={`form-${item.id}`} value={item.id}>{item.username}</Option>
                      ))
                    }
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
AssociatedCompanyComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const CompanyAssociated = Form.create()(AssociatedCompanyComponent);
export default CompanyAssociated;
