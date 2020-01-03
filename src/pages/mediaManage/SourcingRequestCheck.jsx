import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Button, Col, Row, List, Checkbox } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const { TextArea } = Input;
const CheckboxGroup = Checkbox.Group;

/**
 * 文件类型
 0：jpg, jpeg, png, gif,
 1：pdf,
 2：doc, docx,
 3：xls, xlsx,
 4：txt,
 5：rar and zip
 */
const fileTypeIcon = [
  require('../../images/JPG.png'),
  require('../../images/pdf.png'),
  require('../../images/doc.png'),
  require('../../images/XLS.png'),
  require('../../images/txt.png'),
  require('../../images/zip.png'),
];

const servicesList = [
  { value: 1, label: 'FCL' },
  { value: 2, label: 'LCL' },
  { value: 3, label: 'Air import' },
  { value: 4, label: 'Air export' },
  { value: 5, label: 'Trucking' },
  { value: 6, label: 'Warehouse' },
  { value: 7, label: 'Customs declaration' },
  { value: 8, label: 'FBA' },
  { value: 9, label: 'International Express' },
  { value: 10, label: 'Railway' },
  { value: 11, label: 'Import' }
];
class SourcingRequestCheckComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showType: 'view', // view check
      fileList: [],
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
    if (record) {
      this.contentId = record.id;
      this.setState({
        modalVisible: true,
        showType,
      });

      this.getAPIInfo();
      const tmpValue = {
        company_name_en: record.company_name_en,
        subject: record.subject,
        country_name: record.country_name,
        city_name: record.city_name,
        services: record.services,
        content: record.content,
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
          url: `${window.PAY_API_HOST}/baseapi/admin_demand/api/demand/save`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            desc: values.comments,
            id: this.contentId,
            status: 1, // 0-待审核，1-审核通过，2-审核拒绝q
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
    console.log('handleRefused');
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        if (values.comments === '' || !values.comments) {
          message.error('Comments cannot be empty!');
          return;
        }
        this.setState({
          confirmLoading: true,
        });
        // 修改
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_demand/api/demand/save`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            desc: values.comments,
            id: this.contentId,
            status: 2, // 0-待审核，1-审核通过，2-审核拒绝q
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
    const { modalVisible, confirmLoading, showType, fileList } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
    };
    const formItemLayoutRow = {
      labelCol: { span: 10 },
      wrapperCol: { span: 12 },
    };
    let footerArr = [<Button key="back" onClick={this.modalCancel}>Cancel</Button>];
    if (showType === 'check') {
      footerArr = [
        <Button key="submit" type="primary" loading={confirmLoading} onClick={this.handleSubmit}>Confirm</Button>,
        <Button key="refused" type="primary" loading={confirmLoading} onClick={this.handleRefused}>Refused</Button>,
        <Button key="back" onClick={this.modalCancel}>Cancel</Button>,
      ];
    }

    return (
      <div>
        <Modal
          title={showType === 'check' ? 'Check Demand' : 'Demand Information'}
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          footer={footerArr}
          confirmLoading={confirmLoading}
          destroyOnClose
          width="960px"
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
                label="Cooperative Demand"
              >
                {getFieldDecorator('subject', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Cooperative Agent Countries"
                  >
                    {getFieldDecorator('country_name', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="City"
                  >
                    {getFieldDecorator('city_name', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
              </Row>
              <FormItem
                {...formItemLayout}
                label="Demand Services"
              >
                {getFieldDecorator('services', {
                  rules: [{ message: '' }],
                })(

                  <CheckboxGroup disabled >
                    <Row className="roleP-checkbox-row">
                      {
                        servicesList.map(item => (
                          <Checkbox key={item.value} value={item.value} >{item.label}</Checkbox>
                        ))
                      }
                    </Row>
                  </CheckboxGroup>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Demand Description"
              >
                {getFieldDecorator('content', {
                  rules: [{ message: '' }],
                })(
                  <TextArea disabled autosize={{ minRows: 8, maxRows: 20 }} />
                )}
              </FormItem>
              <div className="formSection">
                <Row>
                  <Col span={5}><p className="label"></p></Col>
                  <Col span={18}>
                    <div className="con">
                      <List
                        itemLayout="horizontal"
                        dataSource={fileList}
                        size="small"
                        split={false}
                        locale={{ emptyText: 'No File' }}
                        renderItem={item => (
                          <List.Item>
                            <img className="listAvatar" src={fileTypeIcon[item.upload_type]} />
                            <a className="listA" href={item.upload_url} target="_blank" rel="noopener noreferrer">{item.name}</a>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
              {
                showType === 'check' &&
                <FormItem
                  {...formItemLayout}
                  label="Comments"
                >
                  {getFieldDecorator('comments', {
                    rules: [{ message: '请输入内容' }],
                  })(
                    <TextArea autosize={{ minRows: 6, maxRows: 20 }} />
                  )}
                </FormItem>
              }
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
SourcingRequestCheckComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const SourcingRequestCheck = Form.create()(SourcingRequestCheckComponent);
export default SourcingRequestCheck;
