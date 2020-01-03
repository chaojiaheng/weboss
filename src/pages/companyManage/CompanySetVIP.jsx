import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, DatePicker, Row, Col, Select } from 'antd';
import moment from 'moment';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;

const AILATypeArr = [
  { label: 'AILA', value: 0 },
  { label: 'Original Member', value: 1 },
];


class SetCompanyVIPComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      startTime: moment().add(0, 'YYYY-MM-DD'),
    };
    this.contentId = '';
    this.param = {
      start_time: moment().add(0, 'YYYY-MM-DD').format('X'),
      end_time: '',
    };

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  // 时间区间选择确定
  startOnChange = (dateValue, dateString) => {
    console.log(dateValue, dateString);
    if (dateValue) {
      this.setState({
        startTime: dateValue,
      });
      this.param.start_time = dateValue.format('X');
      console.log(dateValue.format('X'));
    } else {
      this.param.start_time = '';
    }
  };
  endtOnChange = (dateValue, dateString) => {
    console.log(dateValue, dateString);
    if (dateValue) {
      this.param.end_time = dateValue.format('X');
      console.log(dateValue.format('X'));
    } else {
      this.param.end_time = '';
    }
  };

  // 弹出框处理函数
  showModal = (record) => {
    console.log(record);
    this.contentId = '';
    this.setState({
      modalVisible: true,
      startTime: moment().add(0, 'YYYY-MM-DD'),
    });
    this.param.start_time = moment().add(0, 'YYYY-MM-DD').format('X');

    if (record) {
      this.contentId = record.id;
      const tmpValue = {
        company_name_en: record.name_en,
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
        if (!this.param.start_time) {
          message.error('Starting time should not be empty!');
          return;
        }
        if (!this.param.end_time) {
          message.error('End time should not be empty!');
          return;
        }
        this.setState({
          confirmLoading: true,
        });
        // 修改
        console.log('修改');
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/set_aila`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            ...this.param,
            aila_id: values.aila_id,
            company_id: this.contentId,
            subdivision: values.subdivision,
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

        // this.checkAilaId(values.aila_id, () => {
        // });
      }
    });
  };
  checkAilaId = (ailaId, callback) => {
    // 校验邮箱是否存在
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/ailaid/check`,
      method: 'get',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        aila_id: ailaId,
      },
    })
      .then(res => {
        console.log(res);
        // res.data.exist true是存在，false是不存在
        if (res && res.success && res.data && !res.data.exist) {
          if (callback) callback();
        } else if (res && res.success && res.data && res.data.exist) {
          this.setState({
            confirmLoading: false,
          });
          message.error(`AILAID "${ailaId}" has been registered for use!`);
          return false;
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
        return false;
      });
  };

  checkTime = (current, startTime) => {
    if (current) {
      // console.log(current.format('X') <= startTime.format('X'));
      // console.log(current.format('X'));
      // console.log(startTime.format('X'));
      return current.format('X') <= startTime.format('X');
    }
    return false;
    // return current <= startTime;
  };

  render() {
    const { modalVisible, confirmLoading, startTime } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };

    return (
      <div>
        <Modal
          title="Set AILA"
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
                label="AILAID"
              >
                {getFieldDecorator('aila_id', {
                  rules: [
                    { required: true, message: 'Please input AILAID!', },
                    { max: 64, message: 'AILAID can not exceed 64 characters at most!', },
                  ],
                })(
                  <Input />
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="AILA Type"
              >
                {getFieldDecorator('subdivision', {
                  initialValue: 0,
                })(
                  <Select
                    showSearch
                    optionFilterProp="children"
                    // onChange={value => this.OnChangeAll(value, 'saler_id')}
                    allowClear
                  >
                    {
                      AILATypeArr.map(item => (
                        <Option key={`form-${item.value}`} value={item.value}>{item.label}</Option>
                      ))
                    }
                  </Select>
                )}
              </FormItem>
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">Start Time：</p></Col>
                  <Col span={19}>
                    <div className="con">
                      <DatePicker
                        value={startTime}
                        format="YYYY-MM-DD"
                        allowClear={false}
                        onChange={this.startOnChange}
                        // disabledDate={current => current < moment().add(-1, 'day')}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">End Time：</p></Col>
                  <Col span={19}>
                    <div className="con">
                      <DatePicker
                        format="YYYY-MM-DD"
                        allowClear={false}
                        disabledDate={current => this.checkTime(current, startTime)}
                        // disabledDate={current => current <= startTime}
                        onChange={this.endtOnChange}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
SetCompanyVIPComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const CompanySetVIP = Form.create()(SetCompanyVIPComponent);
export default CompanySetVIP;
