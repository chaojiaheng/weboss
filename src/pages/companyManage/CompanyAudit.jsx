import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Button } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const { TextArea } = Input;

class AuditCompanyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
    };
    this.contentId = '';

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

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
        company_name_cn: record.name_cn,
        audit_opinion: record.audit_opinion,
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
        const tmpParam = {
          audit_opinion: values.audit_opinion,
        };
        // delete tmpParam.company_name_en;
        // 修改
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/audit`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            ...tmpParam,
            status: 3,
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
  handleRefused = (e) => {
    console.log('handleSubmit');
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        if (values.audit_opinion === '' || !values.audit_opinion) {
          message.error('Audit Opinion cannot be empty!');
          return;
        }
        this.setState({
          confirmLoading: true,
        });
        const tmpParam = {
          audit_opinion: values.audit_opinion,
        };
        // delete tmpParam.company_name_en;
        // 修改
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/audit`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            ...tmpParam,
            status: 2,
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
    const { modalVisible, confirmLoading } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    const footerArr = [
      <Button key="submit" type="primary" loading={confirmLoading} onClick={this.handleSubmit}>Confirm</Button>,
      <Button key="refused" type="primary" loading={confirmLoading} onClick={this.handleRefused}>Refused</Button>,
      <Button key="back" onClick={this.modalCancel}>Cancel</Button>,
    ];

    return (
      <div>
        <Modal
          title="Audit Company"
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          confirmLoading={confirmLoading}
          footer={footerArr}
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
                label="公司中文名"
              >
                {getFieldDecorator('company_name_cn', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Audit opinion"
              >
                {getFieldDecorator('audit_opinion', {
                  rules: [{ message: '' }],
                })(
                  <TextArea autosize={{ minRows: 6, maxRows: 20 }} />
                )}
              </FormItem>
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
AuditCompanyComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const CompanyAudit = Form.create()(AuditCompanyComponent);
export default CompanyAudit;
