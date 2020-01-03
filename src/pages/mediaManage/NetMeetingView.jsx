import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, Button, Col, Row } from 'antd';
import Utils from '../../common/Utils';

const FormItem = Form.Item;

//  视频会议状态；1-开放申请，2-申请预约，3-已预约，4-过期/结束
const statusList = [
  { label: '开放申请', value: 1 },
  { label: '申请预约', value: 2 },
  { label: '已预约', value: 3 },
  { label: '过期/结束', value: 4 },
];
// 申请状态，0-申请中，1-接受，2-拒绝
const liveInfoStausList = [
  { label: '申请中', value: 0 },
  { label: '接受', value: 1 },
  { label: '拒绝', value: 2 },
];

class NetMeetingViewComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showType: 'view', // view check
      checkTime: Utils.formatTime(1557197677),
      checkStatus: 1,
      liveList: [],
    };
    this.contentId = '';

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  // POST baseapi/live/api/admin/live/info 视频会议-申请列表
  getAPIInfo = () => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/live/api/admin/live/info`,
      method: 'POST',
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
          liveList: (res.data) ? res.data : [],
        });
      })
      .catch(() => {
      });
  };
  // 获取国家
  getCountryList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/country/list`,
      method: 'POST',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        nopage: 1,
      }
    })
      .then(res => {
        const resData = res.data;
        const countryData = [];
        for (let i = 0; i < resData.length; i += 1) {
          countryData.push(
            <Option key={resData[i].id} value={resData[i].id}>{resData[i].name_en}</Option>
          );
        }
        this.setState({
          countryData
        });
      })
      .catch(() => {
      });
  };
  // 获取城市
  getCityList= (countryId) => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/city/list`,
      method: 'POST',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        country_id: countryId,
        nopage: 1,
      }
    })
      .then(res => {
        const resData = res.data;
        const cityData = [];
        for (let i = 0; i < resData.length; i += 1) {
          cityData.push(
            <Option key={resData[i].id} value={resData[i].id}>{resData[i].name_en}</Option>
          );
        }

        this.setState({
          cityData
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
        checkStatus: record.status,
      });

      let statusName = record.status;
      statusList.forEach(item => {
        if (item.value === record.status) {
          statusName = item.label;
          return statusName;
        }
      });

      this.getAPIInfo();
      const tmpValue = {
        company_name_en: record.company_name,
        country_name: record.country_name,
        city_name: record.city_name,
        statusName,
        start_time: Utils.formatTime(record.start_time),
        end_time: Utils.formatTime(record.end_time),
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

  render() {
    const { modalVisible, confirmLoading, liveList } = this.state;// checkStatus
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    const formItemLayoutRow = {
      labelCol: { span: 8 },
      wrapperCol: { span: 14 },
    };
    const footerArr = [<Button key="back" onClick={this.modalCancel}>Cancel</Button>];


    return (
      <div>
        <Modal
          title="One to One Video Information"
          visible={modalVisible}
          onCancel={this.modalCancel}
          footer={footerArr}
          confirmLoading={confirmLoading}
          destroyOnClose
          width="960px"
        >
          <div className="userformBox">
            <h3>Infornation</h3>
            <hr style={{ marginBottom: 10, border: '0.5px solid #c8c8c8' }} />
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
                label="Initiate Company"
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
                    label="Staff"
                  >
                    {getFieldDecorator('staff', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="Status"
                  >
                    {getFieldDecorator('statusName', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Start Time"
                  >
                    {getFieldDecorator('start_time', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="End Time"
                  >
                    {getFieldDecorator('end_time', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Input disabled />
                    )}
                  </FormItem>
                </Col>
              </Row>
            </Form>
            <h3 style={{ marginTop: 20 }}>Request Infornation</h3>
            <hr style={{ marginBottom: 20, border: '0.5px solid #c8c8c8' }} />
            <div>
              {
                liveList.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                    <input className="ant-input ant-input-disabled" disabled style={{ width: 320 }} value={item.company_name_en} />
                    <input className="ant-input ant-input-disabled" disabled style={{ width: 320 }} value={Utils.formatTime(item.created_time)} />
                    <input className="ant-input ant-input-disabled" disabled style={{ width: 160 }} value={liveInfoStausList[item.status].label} />
                  </div>
                ))
              }
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
NetMeetingViewComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const NetMeetingView = Form.create()(NetMeetingViewComponent);
export default NetMeetingView;
