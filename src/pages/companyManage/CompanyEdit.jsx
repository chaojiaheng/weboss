import 'react-select/dist/react-select.css';
import 'react-virtualized-select/styles.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input, Select, message, Row, Col, Tag, Icon, Tooltip, Button } from 'antd';
import VSelect from 'react-virtualized-select';
import debounce from 'lodash/debounce';
import Utils from '../../common/Utils';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

// Trading co. 贸易公司  Freight forwarders 货代公司
const companyType = [
  { label: 'Freight forwarders', value: 1 },
  { label: 'Trading co.', value: 2 }
];
const companySize = [
  { label: 'below 50 people', value: 1 },
  { label: '50~150 person', value: 2 },
  { label: '150~500 person', value: 3 },
  { label: '500~1000 person', value: 4 },
  { label: 'over 1000 people', value: 5 },
];
// `company_size` tinyint(1) DEFAULT NULL COMMENT '公司规模 1-50人以下，2-50~150人，3-150~500人，4-500~1000人，5-1000人以上'
// [{ id: 5119, name_cn: '阿威罗', name_en: 'aveiro', country_id: 0, shipping_line_id: 0 },
//   { id: 5120, name_cn: '华沙', name_en: 'warsaw', country_id: 0, shipping_line_id: 0 },
//   { id: 5121, name_cn: '弗罗茨瓦夫', name_en: 'wroclaw', country_id: 0, shipping_line_id: 0 },
//   { id: 1, code: 'CN', name_cn: '中国', name_en: 'CHINA' },
//   { id: 2, code: 'JP', name_cn: '日本线', name_en: 'JAPAN' },
//   { id: 1, code: 'AAL', name_cn: '澳亚航运有限公司', name_en: 'Austral Asia Line' },
//   { id: 2, code: 'ACL', name_cn: '大西洋箱运有限公司', name_en: 'ATLANTIC CONTAINER LINE' },
// ]

class EditCompanyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      showView: 'edit', // edit  view    edit null默认新建 和编辑     view 是查看模式
      salesData: [],
      countryData: [],
      cityData: [],
      branchOfficeData: [], // 子公司
      majorPortsPOLArr: [],
      shippingLineList: [],
      shippingCompanyList: [],
      // BusinessClassification  公司产品
      businessModalTitle: 'Business Classification',
      businessModalVisible: false,
      businessConfirmLoading: false,
      BusinessClassificationData: [],
      BusinessClassificationAllVaules: {},
      BCSeletedValues: [],
      // wanted_business  希望产品
      wantedCityData: [],
      wantedBusinessData: [],
      portPOLSelectedOption: [],
      portPODSelectedOption: [],
      wantedAreaSelectedOption: [],
      wantedAreaModalVisible: false,
      wantedAreaModalSeletedValues: [],
      wantedAreaCitySeleteId: undefined,
    };
    this.contentId = '';

    this.search = {
      wantedArea_country_id: undefined,
      wantedArea_city_id: undefined,
    };

    this.oldCompayName = '';
    this.debouncecheckComanyName = debounce(this.checkCompayName, 1000);
    this.statusCRM = ''; // CRM添加公司那默认状态改成默认为0，后端接口跟公司管理接口是一个没法改，前端多传个status=0

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentDidMount() {
    this.props.onRef(this);
    this.getSalesList();
    this.getCountryList();
    // this.getCityList('');
    this.getEnumList();
    this.getPortList();
    this.getShippingLineList();
    this.getShippingCompanyList();
  }

  // BusinessClassification 选中或取消产品
  onBCButtonClick = (changeItem) => {
    const { BCSeletedValues } = this.state;

    if (BCSeletedValues.filter(tag => tag.id === changeItem.id).length > 0) {
      const items = BCSeletedValues.filter(tag => tag.id !== changeItem.id);
      console.log(items);
      this.setState({ BCSeletedValues: items });
    } else {
      BCSeletedValues.push(changeItem);
      this.setState({ BCSeletedValues });
    }
  };
  // 添加 子公司
  onClickAddBranchOffice = () => {
    const { branchOfficeData } = this.state;
    branchOfficeData.push({ address_cn: '', address_en: '', phone: '', email: '' });
    this.setState({
      branchOfficeData,
    });
  };
  // 删除 子公司
  onClickBranchDelete = (index, type) => {
    Modal.confirm({
      title: 'Are you sure you want to delete it?',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: () => {
        switch (type) {
          case 'branch': {
            const { branchOfficeData } = this.state;
            console.log('删除：', index);
            branchOfficeData.splice(index, 1);
            this.setState({
              branchOfficeData,
            });
            break;
          }
          default:
            break;
        }
      },
      onCancel: () => {
        // console.log('Cancel');
      },
    });
  };

  // 添加 希望区域
  onClickAddWantedArea = () => {
    const { wantedAreaModalSeletedValues } = this.state;
    if (!this.search.wantedArea_country_id || !this.search.wantedArea_country_id.key || this.search.wantedArea_country_id.key === '' ||
      !this.search.wantedArea_city_id || !this.search.wantedArea_city_id.key || this.search.wantedArea_city_id.key === '') {
      message.error('Please select city information!');
      return;
    }
    let isRepeat = false;
    wantedAreaModalSeletedValues.forEach(item => {
      if (this.search.wantedArea_city_id.key === item.city_id) {
        isRepeat = true;
        return isRepeat;
      }
    });
    if (isRepeat) {
      message.error('Can not be added repeatedly!');
      return;
    }
    wantedAreaModalSeletedValues.push({
      country_id: this.search.wantedArea_country_id.key,
      country_name_en: this.search.wantedArea_country_id.label,
      city_id: this.search.wantedArea_city_id.key,
      city_name_en: this.search.wantedArea_city_id.label
    });
    this.search.wantedArea_city_id = undefined;
    this.setState({
      wantedAreaModalSeletedValues,
      wantedAreaCitySeleteId: undefined,
    });
  };


  // API
  // 获取公司详情
  getCompanyInfo= (id) => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/info`,
      method: 'GET',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        id,
      }
    })
      .then(res => {
        const resData = res.data;
        this.oldCompayName = resData.name_en;
        const tmpValue = {
          name_en: resData.name_en,
          ctype: resData.ctype,
          country_id: resData.country_id,
          city_id: resData.city_id,
          website: resData.website,
          creation_year: resData.creation_year,
          registration_capital: resData.registration_capital,
          company_size: resData.company_size,
          address_en: resData.address_en,
          phone: resData.phone,
          person: resData.person,
          email: resData.email,
          // port_pol: resData.port_pol ? resData.port_pol.map(item => (item.id)) : [],
          // port_pod: resData.port_pod ? resData.port_pod.map(item => (item.id)) : [],
          company_shipping_line: resData.company_shipping_line ? resData.company_shipping_line.map(item => (item.id)) : [],
          company_shipping_company: resData.company_shipping_company ? resData.company_shipping_company.map(item => (item.id)) : [],
          // wanted_area: resData.wanted_area ? resData.wanted_area.map(item => (item.id)) : [],
          // wanted_business: resData.wanted_business ? resData.wanted_business.map(item => (item.id)) : [],
          // products_en: resData.products_en,
          profile_en: resData.profile_en,
          saler_id: resData.saler_id,
        };
        // setTimeout(() => {
        // }, 200);S
        this.props.form.setFieldsValue(tmpValue);

        this.getCityList(resData.country_id);
        this.setState({
          // branchOfficeData: resData.branch,
          BusinessClassificationData: resData.business_classification,
          wantedBusinessData: resData.wanted_business,
          portPOLSelectedOption: resData.port_pol ? resData.port_pol.map(item => ({ value: item.id, label: item.name_en })) : [],
          portPODSelectedOption: resData.port_pod ? resData.port_pod.map(item => ({ value: item.id, label: item.name_en })) : [],
          // wantedAreaSelectedOption: resData.wanted_area ? resData.wanted_area.map(item => ({ value: item.id, label: item.name_en })) : [],
          wantedAreaSelectedOption: resData.wanted_area ? resData.wanted_area : [],
        });
      })
      .catch(() => {
      });
  };

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
        // const countryData = [];
        // for (let i = 0; i < resData.length; i += 1) {
        //   countryData.push(
        //     <Option key={resData[i].id} value={resData[i].id}>{resData[i].name_en}</Option>
        //   );
        // }
        this.setState({
          countryData: resData,
        });
      })
      .catch(() => {
      });
  };
  // 获取城市
  getCityList= (countryId, type) => {
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

        if (type === 'wantedArea') {
          const wantedCityData = [];
          for (let i = 0; i < resData.length; i += 1) {
            wantedCityData.push(
              <Option key={`wantedArea-${resData[i].id}`} value={resData[i].id}>{resData[i].name_en}</Option>
            );
          }
          this.setState({
            // cityData,
            // wantedCityData: resData,
            wantedCityData: cityData
          });
        } else {
          this.setState({
            cityData
          });
        }
      })
      .catch(() => {
      });
  };
  // 获取 枚举值列表
  // Convertional
  // Dangerous Cargo
  // Members type
  // Other convertional
  // Particular Cargo
  // Services
  getEnumList= () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/enum/list`,
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
        console.log(resData);
        this.setState({
          BusinessClassificationAllVaules: resData,
        });
      })
      .catch(() => {
        this.setState({
          BusinessClassificationAllVaules: {},
        });
      });
  };
  //  港口列表
  getPortList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/port/list`,
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
        this.setState({
          majorPortsPOLArr: resData,
        });
      })
      .catch(() => {
      });
  };
  // 获取 航线列表
  getShippingLineList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/shipping_line/list`,
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
        this.setState({
          shippingLineList: resData,
        });
      })
      .catch(() => {
      });
  };
  // 获取 船公司列表
  getShippingCompanyList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/shipping_company/list`,
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
        this.setState({
          shippingCompanyList: resData,
        });
      })
      .catch(() => {
      });
  };

  // BusinessClassification  公司产品
  handleDeleteBusinessC = (removedTag, index) => {
    console.log(index);
    const tags = this.state.BusinessClassificationData.filter(tag => tag.id !== removedTag.id);
    console.log(tags);
    this.setState({ BusinessClassificationData: tags });
  };
  businessModalShow = () => {
    const { BusinessClassificationData } = this.state;
    const tmp = [];
    BusinessClassificationData.forEach(item => {
      tmp.push(item);
    });
    this.setState({
      businessModalTitle: 'Business Classification',
      BCSeletedValues: tmp,
      businessModalVisible: true,
    });
  };
  businessModalOK = () => {
    const { businessModalTitle, BCSeletedValues } = this.state;
    const tmp = [];
    BCSeletedValues.forEach(item => {
      tmp.push(item);
    });
    if (businessModalTitle === 'Business Classification') {
      this.setState({
        BusinessClassificationData: tmp,
        businessModalVisible: false,
      });
    } else if (businessModalTitle === 'Wanted Business') {
      this.setState({
        wantedBusinessData: tmp,
        businessModalVisible: false,
      });
    }
  };
  businessModalCancel = () => {
    this.setState({
      businessModalVisible: false,
    });
  };
  // 生成产品 dom
  createBusinessModalDom= (allVaules) => {
    const domArr = [];
    Object.keys(allVaules).forEach(keyStr => {
      // console.log(keyStr);
      // console.log(allVaules[keyStr]);
      domArr.push((
        <div key={keyStr} className="typeBox">
          <h3>{keyStr}</h3>
          <hr />
          <div className="selectItem">
            {
              allVaules[keyStr].map((item, index) => (
                <Button
                  key={item.id}
                  className={this.state.BCSeletedValues.filter(tag => tag.id === item.id).length > 0 ? 'btn selected' : 'btn'}
                  style={{ marginRight: (index + 1) % 3 === 0 ? 0 : 20 }}
                  onClick={() => this.onBCButtonClick(item)}
                >
                  {item.enum_desc}</Button>
              ))
            }
          </div>
        </div>
      ));
    });
    return domArr;
  };
  // Wanted Business  希望产品
  handleDeleteBusinessCWanted = (removedTag, index) => {
    console.log(index);
    const tags = this.state.wantedBusinessData.filter(tag => tag.id !== removedTag.id);
    console.log(tags);
    this.setState({ wantedBusinessData: tags });
  };
  businessModalShowWanted = () => {
    const { wantedBusinessData } = this.state;
    const tmp = [];
    wantedBusinessData.forEach(item => {
      tmp.push(item);
    });
    this.setState({
      businessModalTitle: 'Wanted Business',
      BCSeletedValues: tmp,
      businessModalVisible: true,
    });
  };


  // 改变
  OnChangeAll = (value, type, obj) => {
    console.log(value, type);
    const { branchOfficeData } = this.state;
    switch (type) {
      case 'country_id' :
        this.props.form.setFieldsValue({ city_id: '' });
        this.getCityList(value);
        break;
      case 'city_id':
        break;
      case 'branch' :
        branchOfficeData[obj.index][obj.key] = value.target.value;
        this.setState({
          branchOfficeData,
        });
        break;
      default:
        break;
    }
  };
  // 港口 pol
  handleChangeVselectPOL = (portPOLSelectedOption) => {
    this.setState({ portPOLSelectedOption });
    console.log(portPOLSelectedOption);
  };
  // 港口 pod
  handleChangeVselectPOD = (portPODSelectedOption) => {
    this.setState({ portPODSelectedOption });
    console.log(portPODSelectedOption);
  };


  // wantedAreaSelectedOption
  handleDeletewantedArea = (removedTag, index) => {
    console.log(index);
    const tags = this.state.wantedAreaSelectedOption.filter(tag => tag.city_id !== removedTag.city_id);
    console.log(tags);
    this.setState({ wantedAreaSelectedOption: tags });
  };
  handleDeletewantedAreaModel = (removedTag, index) => {
    console.log(index);
    const tags = this.state.wantedAreaModalSeletedValues.filter(tag => tag.city_id !== removedTag.city_id);
    console.log(tags);
    this.setState({ wantedAreaModalSeletedValues: tags });
  };
  // Vselect 废弃
  handleChangeVselectWantedArea = (wantedAreaSelectedOption) => {
    this.setState({ wantedAreaSelectedOption });
    console.log(wantedAreaSelectedOption);
  };
  wantedAreaModalShow = () => {
    const { wantedAreaSelectedOption } = this.state;
    const tmp = [];
    wantedAreaSelectedOption.forEach(item => {
      tmp.push(item);
    });
    this.setState({
      wantedAreaModalSeletedValues: tmp,
      wantedAreaModalVisible: true,
    });
  };
  wantedAreaModalOK = () => {
    console.log('wantedAreaModalOK');
    const { wantedAreaModalSeletedValues } = this.state;
    const tmp = [];
    wantedAreaModalSeletedValues.forEach(item => {
      tmp.push(item);
    });
    this.setState({
      wantedAreaSelectedOption: tmp,
      wantedAreaModalVisible: false,
    });
  };
  wantedAreaModalCancel = () => {
    this.setState({
      wantedAreaModalVisible: false,
    });
  };
  searchOnChange = (value, type) => {
    console.log(value, type);
    switch (type) {
      case 'country_id':
        this.search.wantedArea_country_id = value;
        this.search.wantedArea_city_id = undefined;
        this.setState({
          wantedAreaCitySeleteId: this.search.wantedArea_city_id,
        });
        this.getCityList(this.search.wantedArea_country_id ? this.search.wantedArea_country_id.key : '', 'wantedArea');
        break;
      case 'city_id':
        this.search.wantedArea_city_id = value;
        console.log(value);
        this.setState({
          wantedAreaCitySeleteId: this.search.wantedArea_city_id,
        });
        break;
      default:
        break;
    }
    // this.getAPIList(1, this.state.pageSize);
  };


  // 弹出框处理函数
  showModal = (record, showType, statusCRM) => {
    console.log(showType);
    this.statusCRM = statusCRM || '';
    this.contentId = '';
    this.oldCompayName = '';
    this.setState({
      modalVisible: true,
      showType,
      BusinessClassificationData: [],
      branchOfficeData: [],
    });

    if (record) {
      this.contentId = record.id;
      this.getCompanyInfo(this.contentId);
    }
  };
  modalCancel = () => {
    this.props.form.setFieldsValue({});
    this.setState({
      modalVisible: false,
    });
  };
  // 动态校验 公司名是否重名
  validateToCompanyName = (rule, value, callback) => {
    // const form = this.props.form;
    console.log('validateToCompanyName:  ' + value);
    if (value && value !== '' && value !== this.oldCompayName) {
      this.debouncecheckComanyName(value, (isHave, textErr) => {
        if (isHave) callback(textErr);
        else callback();
      });
    } else callback();
  };

  checkCompayName = (value, checkCallback) => {
    console.log('checkCompayName' + value);

    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/check`,
      method: 'get',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        name: value,
      },
    })
      .then(res => {
        console.log(res);
        // res.data.exist true是存在，false是不存在
        if (res && res.success && res.data && !res.data.exist) {
          checkCallback(false);
        } else if (res && res.success && res.data && res.data.exist) {
          checkCallback(true, 'The company name already exists');
        } else {
          checkCallback(true, 'Network error, unable to detect rename, please try again later');
        }
      })
      .catch((error) => {
        console.log(error);
        checkCallback(true, 'Network error, unable to detect rename, please try again later');
      });
  };

  // 提交接口
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        // console.log('Received values of form: ', values);
        this.setState({
          confirmLoading: true,
        });
        const { wantedBusinessData, BusinessClassificationData, portPOLSelectedOption, portPODSelectedOption, wantedAreaSelectedOption } = this.state;
        const majorData = {
          name_en: values.name_en,
          ctype: values.ctype,
          country_id: values.country_id,
          city_id: values.city_id,
          website: values.website,
          creation_year: values.creation_year,
          registration_capital: values.registration_capital,
          company_size: values.company_size,
          address_en: values.address_en,
          phone: values.phone,
          person: values.person,
          email: values.email,
          profile_en: values.profile_en,
          // wanted_area: values.wanted_area ? values.wanted_area.join(',') : '',
          wanted_area: wantedAreaSelectedOption.length > 0 ? wantedAreaSelectedOption.map(item => (item.city_id)).join(',') : '',
        };
        if (this.statusCRM) {
          majorData.status = this.statusCRM; // CRM添加公司那默认状态改成默认为0，后端接口跟公司管理接口是一个没法改，前端多传个status=0
        }
        const tmpData = {
          major: majorData,
          port_pol: portPOLSelectedOption.length > 0 ? portPOLSelectedOption.map(item => (item.value)).join(',') : '',
          port_pod: portPODSelectedOption.length > 0 ? portPODSelectedOption.map(item => (item.value)).join(',') : '',
          company_shipping_line: values.company_shipping_line ? values.company_shipping_line.join(',') : '',
          company_shipping_company: values.company_shipping_company ? values.company_shipping_company.join(',') : '',
          // wanted_business: values.wanted_business ? values.wanted_business.map(item => (JSON.parse(item))) : [], wantedBusinessData
          wanted_business: wantedBusinessData.length > 0 ? wantedBusinessData.map(item => (item.id)).join(',') : '',
          business_classification: BusinessClassificationData.length > 0 ? BusinessClassificationData.map(item => (item.id)).join(',') : '',
          // branch: branchOfficeData,
          saler_id: values.saler_id,
          id: this.contentId,
        };
        console.log(tmpData);
        // const formData = new FormData();
        // formData.append('details', tmpData);
        // 修改
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/save`,
          method: 'post',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            details: JSON.stringify(tmpData),
          },
        })
        .then(res => {
          if (res && res.success) {
            this.setState({
              modalVisible: false,
              confirmLoading: false,
            });
            this.props.form.setFieldsValue({});
            message.success('Success');
            this.props.onOK(this.contentId);
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
    const {
      modalVisible, showType, countryData, cityData, businessModalTitle, businessModalVisible, businessConfirmLoading, salesData,
      BusinessClassificationData, BusinessClassificationAllVaules, majorPortsPOLArr, wantedBusinessData, shippingCompanyList, shippingLineList, wantedCityData,
      portPOLSelectedOption, portPODSelectedOption, wantedAreaSelectedOption, wantedAreaModalVisible, wantedAreaCitySeleteId, wantedAreaModalSeletedValues
    } = this.state; // branchOfficeData
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const email = getFieldValue('email');
    const salesId = getFieldValue('saler_id');
    // console.log(salesId);
    let footerArr = [<Button key="back" onClick={this.modalCancel}>Cancel</Button>];
    if (showType !== 'view') {
      footerArr = [
        <Button key="back" onClick={this.modalCancel}>Cancel</Button>,
        <Button key="submit" type="primary" loading={this.state.confirmLoading} onClick={this.handleSubmit}>OK</Button>,
      ];
    }

    const formItemLayout = {
      labelCol: { span: 5 },
      wrapperCol: { span: 19 },
    };
    const formItemLayoutRow = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
    };

    // const formItemLayoutRow3 = {
    //   labelCol: { span: 12 },
    //   wrapperCol: { span: 12 },
    // };

    return (
      <div>
        <Modal
          title="Company Information"
          visible={modalVisible}
          onOk={this.handleSubmit}
          onCancel={this.modalCancel}
          footer={footerArr}
          confirmLoading={this.state.confirmLoading}
          destroyOnClose
          width="960px"
        >
          <div className="userformBox">
            <Form>
              <FormItem
                {...formItemLayout}
                label="Email"
              >
                {getFieldDecorator('email', {
                  rules: [{ required: true, message: '' }],
                })(
                  <Input disabled={(showType === 'view' || (showType === 'edit' && Boolean(email)))} />
                )}
              </FormItem>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Company Name"
                    hasFeedback
                  >
                    {getFieldDecorator('name_en', {
                      // initialValue: this.props.id,
                      validateFirst: true,
                      rules: [
                        { required: true, message: '' },
                        { validator: this.validateToCompanyName },
                      ],
                    })(
                      <Input disabled={showType === 'view'} />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="Company Type"
                  >
                    {getFieldDecorator('ctype', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Select disabled={showType === 'view'} >
                        { companyType.map(item => (
                          <Option key={item.value} value={item.value}>{item.label}</Option>
                        )) }
                      </Select>
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Country"
                  >
                    {getFieldDecorator('country_id', {
                      // initialValue: this.props.id,
                      rules: [{ required: true, message: '' }],
                    })(
                      <Select
                        disabled={showType === 'view'}
                        showSearch
                        optionFilterProp="children"
                        onChange={value => this.OnChangeAll(value, 'country_id')}
                        allowClear
                      >
                        {
                          countryData.map(item => (
                            <Option key={`form-${item.id}`} value={item.id}>{item.name_en}</Option>
                          ))
                        }
                      </Select>
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="City"
                  >
                    {getFieldDecorator('city_id', {
                      // rules: [{ required: true, message: '' }],
                    })(
                      <Select
                        disabled={showType === 'view'}
                        showSearch
                        optionFilterProp="children"
                        allowClear
                      >
                        { cityData }
                      </Select>
                    )}
                  </FormItem>
                </Col>
              </Row>
              <FormItem
                {...formItemLayout}
                label="Website"
              >
                {getFieldDecorator('website', {
                  rules: [{ message: '' }],
                })(
                  <Input disabled={showType === 'view'} />
                )}
              </FormItem>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Established"
                    // hasFeedback
                  >
                    {getFieldDecorator('creation_year', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled={showType === 'view'} />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="Registration capital"
                  >
                    {getFieldDecorator('registration_capital', {
                      // rules: [{ required: true, message: '请输入名称' }],
                    })(
                      <Input disabled={showType === 'view'} />
                    )}
                  </FormItem>
                </Col>
                {/* <Col span={8} > */}
                {/* </Col> */}
              </Row>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Company Size"
                  >
                    {getFieldDecorator('company_size', {
                      // rules: [{ required: true, message: '请输入名称' }],
                    })(
                      <Select disabled={showType === 'view'} >
                        { companySize.map(item => (
                          <Option key={item.value} value={item.value}>{item.label}</Option>
                        )) }
                      </Select>
                    )}
                  </FormItem>
                </Col>
              </Row>
              {/*
              <FormItem
                {...formItemLayout}
                className="labelB"
                label="Head Office"
              >
              </FormItem>
              */}
              <FormItem
                {...formItemLayout}
                label="Address"
              >
                {getFieldDecorator('address_en', {
                  // initialValue: this.props.id,
                })(
                  <Input disabled={showType === 'view'} />
                )}
              </FormItem>
              <Row type="flex" justify="space-between">
                <Col span={12}>
                  <FormItem
                    {...formItemLayoutRow}
                    label="Contact"
                    // hasFeedback
                  >
                    {getFieldDecorator('person', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled={showType === 'view'} />
                    )}
                  </FormItem>
                </Col>
                <Col span={12} >
                  <FormItem
                    {...formItemLayoutRow}
                    label="Tel"
                    // hasFeedback
                  >
                    {getFieldDecorator('phone', {
                      // initialValue: this.props.id,
                    })(
                      <Input disabled={showType === 'view'} />
                    )}
                  </FormItem>
                </Col>
              </Row>
              {/*
              <FormItem
                {...formItemLayout}
                className="labelB"
                label="Branch Office"
              >
                <div>
                  {
                    showType !== 'view' &&
                    <Tag
                      onClick={this.onClickAddBranchOffice}
                      style={{ background: '#1890ff' }}
                    >
                      <Icon type="plus" /> Add1
                    </Tag>
                  }
                </div>
              </FormItem>
              {
                // border: '1px solid #ccc'
                branchOfficeData.map((item, index) => (
                  <div key={index} style={{ padding: '10px 20px 10px 0', position: 'relative' }}>
                    <FormItem
                      {...formItemLayout}
                      label="Address"
                    >
                      <Input disabled={showType === 'view'} value={item.address_en} onChange={value => this.OnChangeAll(value, 'branch', { index, key: 'address_en' })} />
                    </FormItem>
                    <Row type="flex" justify="space-between">
                      <Col span={12}>
                        <FormItem
                          {...formItemLayoutRow}
                          label="Tel"
                          // hasFeedback
                        >
                          <Input disabled={showType === 'view'} value={item.phone} onChange={value => this.OnChangeAll(value, 'branch', { index, key: 'phone' })} />

                        </FormItem>
                      </Col>
                      <Col span={12} >
                        <FormItem
                          {...formItemLayoutRow}
                          label="Email"
                        >
                          <Input disabled={showType === 'view'} value={item.email} onChange={value => this.OnChangeAll(value, 'branch', { index, key: 'email' })} />
                        </FormItem>
                      </Col>
                    </Row>
                    {
                      showType !== 'view' &&
                      <Button
                        onClick={() => this.onClickBranchDelete(index, 'branch')}
                        style={{ padding: '10px 15px', position: 'absolute', right: -10, top: -18, border: 0 }}
                      >X</Button>
                    }
                  </div>
                ))
              }
              */}
              <FormItem
                {...formItemLayout}
                className="labelB"
                label="Business Classification"
              >
                <div>
                  {BusinessClassificationData.map((item, index) => {
                    const isLongTag = item.enum_desc.length > 30;
                    const tagElem = (
                      <Tag key={item.id} closable={showType !== 'view'} onClose={() => this.handleDeleteBusinessC(item, index)}>
                        {isLongTag ? `${item.enum_desc.slice(0, 30)}...` : item.enum_desc}
                      </Tag>
                    );
                    return isLongTag ? <Tooltip title={item.enum_desc} key={item.enum_desc}>{tagElem}</Tooltip> : tagElem;
                  })}
                  {
                    showType !== 'view' &&
                    <Tag
                      onClick={this.businessModalShow}
                      style={{ background: '#1890ff' }}
                    >
                      <Icon type="plus" /> Add
                    </Tag>
                  }
                </div>
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Major ports(POL)"
              >
                <div>
                  <VSelect
                    className="my-virtualized-select"
                    disabled={showType === 'view'}
                    multi
                    searchable
                    clearable={false}
                    placeholder=""
                    value={portPOLSelectedOption}
                    options={majorPortsPOLArr.map(item => ({ value: item.id, label: item.name_en }))}
                    onChange={this.handleChangeVselectPOL}
                  />
                </div>
                {/* {getFieldDecorator('port_pol', {})()} */}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Major ports(POD)"
              >
                <div>
                  <VSelect
                    className="my-virtualized-select"
                    multi
                    disabled={showType === 'view'}
                    searchable
                    clearable={false}
                    placeholder=""
                    value={portPODSelectedOption}
                    options={majorPortsPOLArr.map(item => ({ value: item.id, label: item.name_en }))}
                    onChange={this.handleChangeVselectPOD}
                  />
                </div>
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Major lines"
              >
                {getFieldDecorator('company_shipping_line', {
                  // initialValue: this.props.id,
                })(
                  <Select mode="multiple" showSearch optionFilterProp="children" disabled={showType === 'view'} >
                    { shippingLineList.map((item, index) => (
                      <Option key={index} value={item.id}>{item.name_en}</Option>
                    )) }
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Shipping companies"
              >
                {getFieldDecorator('company_shipping_company', {
                  // initialValue: this.props.id,
                })(
                  <Select mode="multiple" showSearch optionFilterProp="children" disabled={showType === 'view'}>
                    { shippingCompanyList.map((item, index) => (
                      <Option key={index} value={item.id}>{item.name_en}</Option>
                    )) }
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Wanted Area"
              >
                {/*
                 <div>
                  <VSelect
                    className="my-virtualized-select"
                    multi
                    searchable
                    clearable={false}
                    placeholder=""
                    value={wantedAreaSelectedOption}
                    options={wantedCityData.map(item => ({ value: item.id, label: item.name_en }))}
                    onChange={this.handleChangeVselectWantedArea}
                  />
                </div>
                */}
                <div>
                  {wantedAreaSelectedOption.map((item, index) => {
                    const isLongTag = (item.country_name_en.length + item.city_name_en.length) > 60;
                    const nameStr = `${item.country_name_en}(${item.city_name_en})`;
                    // console.log(item);
                    const tagElem = (
                      <Tag key={item.city_id} closable={showType !== 'view'} onClose={() => this.handleDeletewantedArea(item, index)}>
                        {isLongTag ? `${nameStr.slice(0, 60)}...` : nameStr}
                      </Tag>
                    );
                    return isLongTag ? <Tooltip title={nameStr} key={nameStr}>{tagElem}</Tooltip> : tagElem;
                  })}
                  {
                    showType !== 'view' &&
                    <Tag
                      onClick={this.wantedAreaModalShow}
                      style={{ background: '#1890ff' }}
                    >
                      <Icon type="plus" /> Add
                    </Tag>
                  }
                </div>
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Wanted Business"
              >
                <div>
                  {wantedBusinessData.map((item, index) => {
                    const isLongTag = item.enum_desc.length > 30;
                    const tagElem = (
                      <Tag key={item.id} closable={showType !== 'view'} onClose={() => this.handleDeleteBusinessCWanted(item, index)}>
                        {isLongTag ? `${item.enum_desc.slice(0, 30)}...` : item.enum_desc}
                      </Tag>
                    );
                    return isLongTag ? <Tooltip title={item.enum_desc} key={item.enum_desc}>{tagElem}</Tooltip> : tagElem;
                  })}
                  {
                    showType !== 'view' &&
                    <Tag
                      onClick={this.businessModalShowWanted}
                      style={{ background: '#1890ff' }}
                    >
                      <Icon type="plus" /> Add
                    </Tag>
                  }
                </div>
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Company Profile"
              >
                {getFieldDecorator('profile_en', {
                  rules: [{ message: '' }],
                })(
                  <TextArea disabled={showType === 'view'} autosize={{ minRows: 4, maxRows: 16 }} />
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
                    disabled={(showType !== 'add' && Boolean(salesId))}
                    showSearch
                    optionFilterProp="children"
                    // onChange={value => this.OnChangeAll(value, 'saler_id')}
                    allowClear
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

        {/* 公司主要产品 Business Classification */}
        <Modal
          title={businessModalTitle}
          style={{ top: 160 }}
          visible={businessModalVisible}
          onOk={this.businessModalOK}
          onCancel={this.businessModalCancel}
          confirmLoading={businessConfirmLoading}
          width="660px"
        >
          <div className="userformBoxList">
            {
              this.createBusinessModalDom(BusinessClassificationAllVaules)
            }
          </div>
        </Modal>

        {/* 希望的区域 Wanted Area */}
        <Modal
          title="Wanted Area"
          style={{ top: 160 }}
          visible={wantedAreaModalVisible}
          onOk={this.wantedAreaModalOK}
          onCancel={this.wantedAreaModalCancel}
          width="660px"
        >
          <div className="userformBoxList">
            <Row type="flex" justify="space-between">
              <Col span={10}>
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    labelInValue
                    onChange={value => this.searchOnChange(value, 'country_id')}
                    style={{ width: 240, marginRight: 7 }}
                    placeholder="Country"
                    allowClear
                  >
                    {
                      countryData.map(item => (
                        <Option key={`wantedArea-${item.id}`} value={item.id}>{item.name_en}</Option>
                      ))
                    }
                  </Select>
                </div>
              </Col>
              <Col span={10} >
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    labelInValue
                    value={wantedAreaCitySeleteId}
                    onChange={value => this.searchOnChange(value, 'city_id')}
                    style={{ width: 260, marginRight: 7 }}
                    placeholder="City"
                    allowClear
                  >
                    { wantedCityData }
                  </Select>
                </div>
              </Col>
              <Col span={4} >
                <div style={{ marginLeft: 20 }}>
                  <Button type="primary" onClick={this.onClickAddWantedArea}><Icon type="plus" /> Add</Button>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 20 }}>
              {wantedAreaModalSeletedValues.map((item, index) => {
                const isLongTag = (item.country_name_en.length + item.city_name_en.length) > 60;
                const nameStr = `${item.country_name_en}(${item.city_name_en})`;
                // console.log(item);
                const tagElem = (
                  <Tag key={item.city_id} closable onClose={() => this.handleDeletewantedAreaModel(item, index)}>
                    {isLongTag ? `${nameStr.slice(0, 60)}...` : nameStr}
                  </Tag>
                );
                return isLongTag ? <Tooltip title={nameStr} key={nameStr}>{tagElem}</Tooltip> : tagElem;
              })}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
EditCompanyComponent.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};

const CompanyEdit = Form.create()(EditCompanyComponent);
export default CompanyEdit;
