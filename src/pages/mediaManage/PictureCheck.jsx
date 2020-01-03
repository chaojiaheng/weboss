import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Button, Col, Row } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const { TextArea } = Input;

const pictrueTypeList = [
  { label: 'Qualification', value: 1 },
  { label: 'Gallery', value: 2 },
];
//  0-未审核 Unaudited ，1-审核通过 Confirm，2-审核未通过 Refused
const statusList = [
  { label: 'Unaudited', value: 0 },
  { label: 'Confirm', value: 1 },
  { label: 'Refused', value: 2 },
];

class PictureCheckComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showType: 'view', // view check
      fileSrc: '',
      modalFileVisible: false,
      checkTime: '', // Utils.formatTime(1557197677),
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

    if (record) {
      this.contentId = record.id;
      this.setState({
        modalVisible: true,
        checkStatus: record.audit_status,
        showType,
        fileSrc: record.picture_url,
        checkTime: Utils.formatTime(record.updated_time),
      });

      // this.getAPIInfo();
      let pictrueTypeName = record.picture_type;
      pictrueTypeList.forEach(item => {
        if (item.value === record.picture_type) {
          pictrueTypeName = item.label;
          return pictrueTypeName;
        }
      });
      const tmpValue = {
        company_name_en: record.company_name,
        country_name: record.country_name,
        pictrueTypeName,
        city_name: record.city_name,
        created_time: Utils.formatTime(record.created_time),
        comments: record.desc ? record.desc : '',
      };
      if (showType === 'view' && record.status === 0) {
        delete tmpValue.comments;
      }
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

  // 放大预览
  modalFileShow = () => {
    this.setState({
      modalFileVisible: true,
    });
  };
  modalFileCancel = () => {
    this.setState({
      modalFileVisible: false,
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
          url: `${window.PAY_API_HOST}/baseapi/media/api/pic/update`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            desc: values.comments,
            id: this.contentId,
            audit_status: 1, // 0-待审核，1-审核通过，2-审核拒绝q
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
          url: `${window.PAY_API_HOST}/baseapi/media/api/pic/update`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            desc: values.comments,
            id: this.contentId,
            audit_status: 2, // 0-待审核，1-审核通过，2-审核拒绝q
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
    const { modalVisible, confirmLoading, showType, fileSrc, modalFileVisible, checkTime, checkStatus } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    const formItemLayoutRow = {
      labelCol: { span: 8 },
      wrapperCol: { span: 14 },
    };
    let footerArr = [<Button key="back" onClick={this.modalCancel}>Cancel</Button>];
    if (showType === 'check' && checkStatus === 0) {
      footerArr = [
        <Button key="submit" type="primary" loading={confirmLoading} onClick={this.handleSubmit}>Confirm</Button>,
        <Button key="refused" type="primary" loading={confirmLoading} onClick={this.handleRefused}>Refused</Button>,
        <Button key="back" onClick={this.modalCancel}>Cancel</Button>,
      ];
    }
    let statusName = checkStatus;
    statusList.forEach(item => {
      if (item.value === checkStatus) {
        statusName = item.label;
        return statusName;
      }
    });


    return (
      <div>
        <Modal
          title={showType === 'check' ? 'Check Picture' : 'Picture Information'}
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
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Country"
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
                label="Company Name"
              >
                {getFieldDecorator('company_name_en', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled />
                )}
              </FormItem>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Picture Type"
                  >
                    {getFieldDecorator('pictrueTypeName', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="Create Time"
                  >
                    {getFieldDecorator('created_time', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
              </Row>
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">Picture：</p></Col>
                  <Col span={19}>
                    <div className="con">
                      <img src={fileSrc} onClick={this.modalFileShow} />
                    </div>
                  </Col>
                </Row>
              </div>
              {
                checkStatus > 0 &&
                <div className="formSection">
                  <Row>
                    <Col span={4}><p className="label">Check Time：</p></Col>
                    <Col span={19}>
                      <div className="con">
                        <Input value={checkTime} disabled />
                      </div>
                    </Col>
                  </Row>
                </div>
              }
              {
                checkStatus > 0 &&
                <div className="formSection">
                  <Row>
                    <Col span={4}><p className="label">Check Status：</p></Col>
                    <Col span={19}>
                      <div className="con">
                        <Input value={statusName} disabled />
                      </div>
                    </Col>
                  </Row>
                </div>
              }
              {
                (showType === 'check' && checkStatus === 0) &&
                <FormItem
                  {...formItemLayout}
                  label="Comments"
                >
                  {getFieldDecorator('comments', {
                    rules: [{ message: '' }],
                  })(
                    <TextArea autosize={{ minRows: 6, maxRows: 20 }} />
                  )}
                </FormItem>
              }
              {
                checkStatus > 0 &&
                <FormItem
                  {...formItemLayout}
                  label="Comments"
                >
                  {getFieldDecorator('comments', {
                    rules: [{ message: '' }],
                  })(
                    <TextArea autosize={{ minRows: 6, maxRows: 20 }} disabled />
                  )}
                </FormItem>
              }
            </Form>
          </div>
        </Modal>

        <Modal
          visible={modalFileVisible}
          footer={null}
          onCancel={this.modalFileCancel}
          width={960}
          // style={}
        >
          <div style={{ margin: '12px 14px 8px 14px', display: 'flex', justifyContent: 'center' }}>
            <img src={fileSrc} style={{ width: '100%', height: '100%' }} />
          </div>
        </Modal>
      </div>
    );
  }
}
PictureCheckComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const PictureCheck = Form.create()(PictureCheckComponent);
export default PictureCheck;
