import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, message, Row, Col, Select, Spin, Icon, Tooltip, Upload } from 'antd';
import debounce from 'lodash/debounce';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;

class VideoUploadComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      getCompanyIng: false,
      companyList: [],
      videoLoading: 0, // 图片上传状态  0 未上传   1  上传中    2 上传完成
      videoLoadingProgress: 0,
      videoSnapshot: '', // https://wx3.sinaimg.cn/mw690/53a7ac51ly1g3bb9xdesxj20c007qta4.jpg
    };
    this.contentId = '';
    this.getCompanyListSearch = debounce(this.getCompanyList, 800);
    this.myUploader = null; // 上传对象
    this.VideoData = null;   // 上传成功的图片对象

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  //  文件上传
  onFileChange = (e) => {
    console.log(e.target.files);
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    // const Title = file.name;
    const userData = '{"Vod":{}}';
    if (this.myUploader) {
      this.myUploader.stopUpload();
    }
    this.myUploader = this.createUploader();
    console.log(userData);
    this.myUploader.addFile(file, null, null, null, userData);
  };
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
      videoLoading: 1,
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


  // 弹出框处理函数
  showModal = () => {
    this.contentId = '';
    this.getCompanyListSearch('');
    this.setState({
      modalVisible: true,
      videoLoading: 0,
    });
  };
  modalCancel = () => {
    this.setState({
      modalVisible: false,
    });
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
        if (!uploadInfo.videoId) {
          Utils.request({
            url: `${window.PAY_API_HOST}/baseapi/media/api/get_up_video_token`,
            method: 'get',
            headers: {
              token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
            },
            data: {
              title: this.props.form.getFieldValue('title'),
              file_name: uploadInfo.file.name,  // 文件名，必须包含后缀名，后缀名不区分大小写。如：23.mp4
              video_type: 1, // 视频类型：1-点播，2-直播转点播
              company_id: this.props.form.getFieldValue('company_id'),
            }
          })
            .then(res => {
              if (res && res.success) {
                console.log(res.data);
                this.VideoData = res.data;
                uploader.setUploadAuthAndAddress(uploadInfo, res.data.UploadAuth, res.data.UploadAddress, res.data.VideoId);
              }
            })
            .catch(() => {
              message.error('UploadAuth Fail');
            });
          console.log('文件开始上传...');
          console.log('onUploadStarted:' + uploadInfo.file.name + ', endpoint:' + uploadInfo.endpoint + ', bucket:' + uploadInfo.bucket + ', object:' + uploadInfo.object);
        } else {
          // 如果videoId有值，根据videoId刷新上传凭证
          // https://help.aliyun.com/document_detail/55408.html?spm=a2c4g.11186623.6.630.BoYYcY
          Utils.request({
            url: `${window.PAY_API_HOST}/baseapi/media/api/refresh_up_video_token`,
            method: 'get',
            headers: {
              token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
            },
            data: {
              video_id: uploadInfo.videoId,
            }
          })
            .then(res => {
              if (res && res.success) {
                this.VideoData = res.data;
                uploader.setUploadAuthAndAddress(uploadInfo, res.data.UploadAuth, res.data.UploadAddress, res.data.VideoId);
              }
            })
            .catch(() => {
              message.error('UploadAuth Fail');
            });
        }
      },
      // 文件上传成功
      onUploadSucceed: (uploadInfo) => {
        console.log('onUploadSucceed: ' + uploadInfo.file.name + ', endpoint:' + uploadInfo.endpoint + ', bucket:' + uploadInfo.bucket + ', object:' + uploadInfo.object);
        console.log('文件上传成功!' + uploadInfo.videoId);
        this.myUploader = null;
        this.setState({
          videoLoading: 2,
        });
        // message.success('Video upload success!');
        Modal.success({
          title: 'Video upload success!',
          content: '',
          okText: 'OK',
          onOk: () => {
            this.setState({
              modalVisible: false,
              confirmLoading: false,
            });
            this.props.onOK();
          }
        });
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
        this.setState({
          videoLoadingProgress: progressPercent,
        });
        console.log('文件上传中...');
      },
      // 上传凭证超时
      onUploadTokenExpired: (uploadInfo) => {
        // 上传大文件超时, 如果是上传方式一即根据 UploadAuth 上传时
        // 需要根据 uploadInfo.videoId 调用刷新视频上传凭证接口(https://help.aliyun.com/document_detail/55408.html)重新获取 UploadAuth
        // 然后调用 resumeUploadWithAuth 方法, 这里是测试接口, 所以我直接获取了 UploadAuth
        console.log('文件上传超时!');

        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/media/api/refresh_up_video_token`,
          method: 'get',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            video_id: uploadInfo.videoId,
          }
        })
          .then(res => {
            if (res && res.success) {
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
        // this.setState({
        //   confirmLoading: true,
        // });
      }
    });
  };

  render() {
    const { modalVisible, confirmLoading, getCompanyIng, companyList, videoLoading, videoSnapshot, videoLoadingProgress } = this.state;
    const { getFieldDecorator, } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 19 },
    };
    const canUpload = (this.props.form.getFieldValue('company_id') && this.props.form.getFieldValue('title'));

    const uploadButton = (
      <div>
        {
          canUpload &&
          <div>{(videoLoading === 0 || videoLoading === 1) ? (videoLoading === 0 ? <Icon type="plus" /> : <Icon type="loading">{` ${videoLoadingProgress}%`}</Icon>) : <span> 100%</span>}</div>
        }
        {
          !canUpload &&
          <div style={{ color: 'red' }} >
            <Tooltip title="Please fill in the company and video name information first!"><Icon type="question-circle-o" /></Tooltip>
          </div>
        }
        <div className="ant-upload-text">Upload</div>
      </div>
    );

    console.log(this.props.form.getFieldValue('company_id'));
    return (
      <div>
        <Modal
          title="Upload Video"
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
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
                {getFieldDecorator('company_id', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Select
                    showSearch
                    // labelInValue
                    disabled={Boolean(videoSnapshot)}
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
                label="Video Name"
              >
                {getFieldDecorator('title', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input disabled={Boolean(videoSnapshot)} />
                )}
              </FormItem>
              <div className="formSection">
                <Row>
                  <Col span={4}><p className="label">Video：</p></Col>
                  <Col span={19}>
                    <div className="UploadDiv">
                      <Upload
                        disabled={(!canUpload || Boolean(videoSnapshot))}
                        name="avatar"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        onChange={this.onUploadFileChange}
                      >
                        {videoSnapshot ? <span>Video Uploaded</span> : uploadButton}
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
VideoUploadComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const VideoUpload = Form.create()(VideoUploadComponent);
export default VideoUpload;
