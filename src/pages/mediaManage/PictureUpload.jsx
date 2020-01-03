import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, DatePicker, Row, Col, Radio, Select, Spin, Upload, Icon, Tooltip } from 'antd';
import debounce from 'lodash/debounce';
import moment from 'moment';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;
const { confirm } = Modal;
// 照片类型有 办公和  认证照片   认证照片需要审核  Qualification（认证图片）、Gallery（办公图片）
const pictrueTypeList = [
  { label: 'Qualification', value: 1 },
  { label: 'Gallery', value: 2 },
];

const qualificationTypeList = [
  { label: 'NVOCC', value: 31 },
  { label: 'FIATA', value: 32 },
  { label: 'WCA', value: 33 },
  { label: 'IATA', value: 34 },
  { label: 'GCP', value: 35 },
  { label: 'Wiffa', value: 36 },
  { label: 'IFFA', value: 37 },
  { label: 'OFN', value: 38 },
  { label: 'Honors', value: 39 },
  { label: 'AILA', value: 40 },
  { label: 'AA', value: 41 },
  { label: 'Other', value: 42 },
];

class PictureUploadComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      startTime: moment().add(0, 'day'),
      endTime: null,
      pictureType: pictrueTypeList[0].value,
      getCompanyIng: false,
      companyList: [],
      imageLoading: false, // 图片上传状态
      imageUrl: '',
    };
    this.contentId = '';
    this.param = {
      start_time: moment().add(0, 'day').format('X'),
      end_time: '',
    };
    this.getCompanyListSearch = debounce(this.getCompanyList, 500);
    this.myUploader = null;  // 上传对象
    this.ImageData = null;   // 上传成功的图片对象
    this.QualificationIsSave = false;

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  //  文件上传
  onUploadFileChange = (info) => {
    console.log(info);
    const file = info.file.originFileObj;
    if (!file || info.file.status !== 'uploading' || info.event) {
      return;
    }
    console.log(info.file.status);
    // const Title = file.name;
    const userData = '{"Vod":{}}';
    if (this.myUploader) {
      console.log('stopUpload');
      this.myUploader.stopUpload();
    }
    this.myUploader = this.createUploader();
    console.log(userData);
    this.myUploader.addFile(file, null, null, null, userData);
    this.setState({
      imageLoading: true,
    });
  };

  // 获取列表
  getCompanyList = (nameEn) => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/company/api/company/lite_list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        name_en: nameEn,
        start: 0,
        limit: 50,
      }
    })
      .then(res => {
        const resData = res.data;
        console.log(resData);
        this.setState({
          companyList: resData,
        });
      })
      .catch(() => {
      });
  };

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
      this.setState({
        endTime: dateValue,
      });
      this.param.end_time = dateValue.format('X');
      console.log(dateValue.format('X'));
    } else {
      this.param.end_time = '';
    }
  };

  // 弹出框处理函数
  showModal = () => {
    this.contentId = '';
    this.getCompanyListSearch('');
    this.setState({
      modalVisible: true,
      startTime: moment().add(0, 'day'),
      pictureType: pictrueTypeList[0].value,
    });
    this.QualificationIsSave = false;
    this.param.start_time = moment().add(0, 'day').format('X');
  };
  modalCancel = () => {
    if (!this.QualificationIsSave && this.state.pictureType === pictrueTypeList[0].value) {
      confirm({
        title: 'Authentication information is not saved!',
        content: 'Are you sure you want to close the window?',
        onOk: () => {
          this.setState({
            modalVisible: false,
            confirmLoading: false,
          });
          this.props.onOK();
        },
        onCancel() {},
      });
    } else {
      this.setState({
        modalVisible: false,
        confirmLoading: false,
      });
      this.props.onOK();
    }
  };

  /**
   * 创建一个上传对象
   * 使用 UploadAuth 上传方式
   */
  createUploader = () => {
    const uploader = new AliyunUpload.Vod({
      // 阿里账号ID，必须有值 ，值的来源https://help.aliyun.com/knowledge_detail/37196.html  账号id：1835534545729959
      // region：cn-shanghai
      userId: '1835534545729959',
      // 上传到点播的地域， 默认值为'cn-shanghai',//eu-central-1,ap-southeast-1
      region: 'cn-shanghai',
      // 分片大小默认1M，不能小于100K
      partSize: 1048576,
      // 并行上传分片个数，默认5
      parallel: 5,
      // 网络原因失败时，重新上传次数，默认为3
      retryCount: 3,
      // 网络原因失败时，重新上传间隔时间，默认为2秒
      retryDuration: 2,
      // 请求过期时间（配置项 timeout, 默认 60000 单位毫秒）
      timeout: 60000,
      // 添加文件成功
      addFileSuccess: (uploadInfo) => {
        console.log('addFileSuccess');
        console.log('添加文件成功, 等待上传...');
        console.log('addFileSuccess: ' + uploadInfo.file.name);
        uploader.startUpload();
      },
      // 开始上传
      onUploadstarted: (uploadInfo) => {
        // 如果是 UploadAuth 上传方式, 需要调用 uploader.setUploadAuthAndAddress 方法
        // 如果是 UploadAuth 上传方式, 需要根据 uploadInfo.videoId是否有值，调用点播的不同接口获取uploadauth和uploadAddress
        // 如果 uploadInfo.videoId 有值，调用刷新视频上传凭证接口，否则调用创建视频上传凭证接口
        // 注意: 这里是测试 demo 所以直接调用了获取 UploadAuth 的测试接口, 用户在使用时需要判断 uploadInfo.videoId 存在与否从而调用 openApi
        // 如果 uploadInfo.videoId 存在, 调用 刷新视频上传凭证接口(https://help.aliyun.com/document_detail/55408.html)
        // 如果 uploadInfo.videoId 不存在,调用 获取视频上传地址和凭证接口(https://help.aliyun.com/document_detail/55407.html)

        console.log(uploadInfo.videoId);
        console.log(uploadInfo);
        console.log(!uploadInfo.videoId);
        if (!uploadInfo.videoId) {
          Utils.request({
            url: `${window.PAY_API_HOST}/baseapi/media/api/get_up_image_token`,
            method: 'get',
            headers: {
              token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
            },
            data: {
              title: this.props.form.getFieldValue('title'),
              file_name: uploadInfo.file.name,  // 文件名，必须包含后缀名，后缀名不区分大小写。如：23.jpg
              picture_type: this.state.pictureType,
              company_id: this.props.form.getFieldValue('company_id'),
            }
          })
            .then(res => {
              if (res && res.success) {
                console.log(res.data);
                this.ImageData = res.data;
                uploader.setUploadAuthAndAddress(uploadInfo, res.data.UploadAuth, res.data.UploadAddress, res.data.ImageId);
              }
            })
            .catch(() => {
              message.error('UploadAuth Fail');
            });
          console.log('文件开始上传...');
          console.log('onUploadStarted:' + uploadInfo.file.name + ', endpoint:' + uploadInfo.endpoint + ', bucket:' + uploadInfo.bucket + ', object:' + uploadInfo.object);
        }
      },
      // 文件上传成功
      onUploadSucceed: (uploadInfo) => {
        console.log('onUploadSucceed: ' + uploadInfo.file.name + ', endpoint:' + uploadInfo.endpoint + ', bucket:' + uploadInfo.bucket + ', object:' + uploadInfo.object);
        console.log('文件上传成功!');
        console.log(uploadInfo);
        this.myUploader = null;
        this.setState({
          imageLoading: false,
          imageUrl: this.ImageData.ImageURL,
        });
        if (this.state.pictureType === pictrueTypeList[1].value) {
          confirm({
            title: 'Gallery picture upload success!',
            content: 'Do you want to close the window?',
            onOk: () => {
              this.setState({
                modalVisible: false,
                confirmLoading: false,
              });
              this.props.onOK();
            },
            onCancel() {},
          });
        } else {
          Modal.success({
            title: 'Qualification picture upload success!',
            content: 'Please save the authentication information!',
            okText: 'OK'
          });
        }
      },
      // 文件上传失败
      onUploadFailed: (uploadInfo, code, uploadIMessage) => {
        console.log('onUploadFailed: file:' + uploadInfo.file.name + ',code:' + code + ', message:' + uploadIMessage);
        console.log('文件上传失败!');
      },
      // 取消文件上传
      onUploadCanceled: (uploadInfo, code, uploadIMessage) => {
        console.log('Canceled file: ' + uploadInfo.file.name + ', code: ' + code + ', message:' + uploadIMessage);
        console.log('文件上传已暂停!');
      },
      // 文件上传进度，单位：字节, 可以在这个函数中拿到上传进度并显示在页面上
      onUploadProgress: (uploadInfo, totalSize, progress) => {
        console.log('onUploadProgress:file:' + uploadInfo.file.name + ', fileSize:' + totalSize + ', percent:' + Math.ceil(progress * 100) + '%');
        const progressPercent = Math.ceil(progress * 100);
        console.log(progressPercent);
        console.log('文件上传中...');
      },
      // 上传凭证超时
      onUploadTokenExpired: (uploadInfo) => {
        // 上传大文件超时, 如果是上传方式一即根据 UploadAuth 上传时
        // 需要根据 uploadInfo.videoId 调用刷新视频上传凭证接口(https://help.aliyun.com/document_detail/55408.html)重新获取 UploadAuth
        // 然后调用 resumeUploadWithAuth 方法, 这里是测试接口, 所以我直接获取了 UploadAuth
        console.log('文件上传超时!');

        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/media/api/get_up_image_token`,
          method: 'get',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            title: this.props.form.getFieldValue('title'),
            file_name: uploadInfo.file.name,
            picture_type: this.state.pictureType,
            company_id: this.props.form.getFieldValue('company_id'),
          }
        })
          .then(res => {
            if (res && res.success) {
              console.log(res.data);
              this.ImageData = res.data;
              uploader.resumeUploadWithAuth(res.data.UploadAuth);
              console.log('upload expired and resume upload with uploadauth ' + res.data.UploadAuth);
            }
          })
          .catch(() => {
            message.error('UploadAuth Fail');
          });
      },
      // 全部文件上传结束
      onUploadEnd: (uploadInfo) => {
        console.log('文件上传完毕!');
        console.log('onUploadEnd: uploaded all the files' + uploadInfo);
      }
    });
    return uploader;
  };

  // 提交接口
  handleSubmit = (e) => {
    console.log('handleSubmit');
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        if (this.state.pictureType === pictrueTypeList[0].value) {
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

          this.uploadAPI();
        } else {
          this.setState({
            modalVisible: false,
            confirmLoading: false,
          });
          this.props.onOK();
        }
      }
    });
  };

  uploadAPI = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/qualification/api/qualification/save`,
      method: 'POST',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        ...this.param,
        qualification_type: this.props.form.getFieldValue('qualification_type'),
        picture_id: this.ImageData.ImageId,
        company_id: this.props.form.getFieldValue('company_id'),
      }
    })
      .then(res => {
        if (res && res.success) {
          console.log(res.data);
          message.success('Authentication information saved successfully!');
          this.QualificationIsSave = true;
          this.setState({
            modalVisible: false,
            confirmLoading: false,
          });
          this.props.onOK();
        }
      })
      .catch(() => {
        message.error('Authentication information saved failed, please try again!');
      });
  };

  render() {
    const { modalVisible, confirmLoading, startTime, pictureType, getCompanyIng, companyList, imageLoading, imageUrl, endTime } = this.state;
    const { getFieldDecorator, } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    let canUpload = (this.props.form.getFieldValue('company_id') && this.props.form.getFieldValue('title'));
    if (pictureType === pictrueTypeList[0].value) {
      canUpload = (this.props.form.getFieldValue('company_id') && this.props.form.getFieldValue('title') && (this.props.form.getFieldValue('qualification_type') > -1) && startTime && endTime);
    }

    const uploadButton = (
      <div>
        {
          canUpload &&
          <Icon type={imageLoading ? 'loading' : 'plus'} />
        }
        {
          !canUpload &&
          <div style={{ color: 'red' }} >
            <Tooltip title="Please fill in the company and picture name information first!"><Icon type="question-circle-o" /></Tooltip>
          </div>
        }
        <div className="ant-upload-text">Upload</div>
      </div>
    );

    console.log(this.props.form.getFieldValue('company_id'));
    return (
      <div>
        <Modal
          title="Upload Pictrue"
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          confirmLoading={confirmLoading}
          destroyOnClose
          width="960px"
        >
          <div className="userformBox">
            <Form>
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">Picture Type：</p></Col>
                  <Col span={19}>
                    <div className="con">
                      <Radio.Group onChange={e => this.setState({ pictureType: e.target.value })} value={pictureType} disabled={Boolean(imageUrl)} >
                        {
                          pictrueTypeList.map(item => (
                            <Radio key={`pictureType${item.value}`} value={item.value}>{item.label}</Radio>
                          ))
                        }
                      </Radio.Group>
                    </div>
                  </Col>
                </Row>
              </div>
              {
                pictureType === pictrueTypeList[0].value &&
                <FormItem
                  {...formItemLayout}
                  label="Qualification Type"
                >
                  {getFieldDecorator('qualification_type', {
                    rules: [{ required: true, message: '' }],
                  })(
                    <Radio.Group>
                      {
                        qualificationTypeList.map(item => (
                          <Radio key={`qualification_type${item.value}`} value={item.value}>{item.label}</Radio>
                        ))
                      }
                    </Radio.Group>
                  )}
                </FormItem>
              }
              <FormItem
                {...formItemLayout}
                label="Company Name"
              >
                {getFieldDecorator('company_id', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Select
                    showSearch
                    // labelInValue
                    disabled={Boolean(imageUrl)}
                    placeholder="Select Company"
                    notFoundContent={getCompanyIng ? <Spin size="small" /> : null}
                    filterOption={false}
                    defaultActiveFirstOption={false}
                    onSearch={this.getCompanyListSearch}
                    style={{ width: '100%' }}
                  >
                    {companyList.map(item => (
                      <Option key={item.id} value={item.id}>{item.name_en}</Option>
                    ))}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Picture Name"
              >
                {getFieldDecorator('title', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input disabled={Boolean(imageUrl)} />
                )}
              </FormItem>
              {
                pictureType === pictrueTypeList[0].value &&
                <div>
                  <div className="formSection">
                    <Row>
                      <Col span={4}><p className="label">Start Time：</p></Col>
                      <Col span={19}>
                        <div className="con">
                          <DatePicker
                            allowClear={false}
                            value={startTime}
                            format="YYYY-MM-DD"
                            onChange={this.startOnChange}
                            disabledDate={current => current < moment().add(-1, 'day')}
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
                            allowClear={false}
                            value={endTime}
                            format="YYYY-MM-DD"
                            disabledDate={current => current <= startTime}
                            onChange={this.endtOnChange}
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              }
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">Picture：</p></Col>
                  <Col span={19}>
                    <div className="UploadDiv">
                      <Upload
                        disabled={(!canUpload || Boolean(imageUrl))}
                        name="avatar"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        onChange={this.onUploadFileChange}
                      >
                        {imageUrl ? <img src={imageUrl} alt="avatar" /> : uploadButton}
                      </Upload>
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
PictureUploadComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const PictureUpload = Form.create()(PictureUploadComponent);
export default PictureUpload;
