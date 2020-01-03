import React, { Component } from 'react';
import { Layout, Breadcrumb, Table, Select, Button, Input, Divider, message, Modal } from 'antd'; // Checkbox
import CompanyEdit from './../companyManage/CompanyEdit';
import CompanyAssociated from './CompanyAssociated';
import Utils from '../../common/Utils';

import './crmManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { confirm } = Modal;
// const CheckboxGroup = Checkbox.Group;


const companyStatus = [
  { label: 'Unactivated', value: 0 },
  { label: 'Pending Approval', value: 1 },
  { label: 'Rejected', value: 2 },
  { label: 'Approved', value: 3 },
  { label: 'VIP Company', value: 4 },
];

const salesArr = [
  { label: 'Sales', value: '1' },
  { label: 'Public Pool', value: '2' },
];

class CompanyList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      selectedRowsId: [],
      loading: false,
      current: 1,
      pageSize: 10,
      tableTotal: '',
      tableData: [],
      countryData: [],
      cityData: [],
      citySeleteId: undefined,
      salesData: [],
      salesCheckedList: salesArr.map(item => item.value), // 搜索
    };


    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;

    this.search = {
      name_en: '',
      country_id: '',
      city_id: '',
      has_saler: '1',
      saler_id: this.AILA_userInfo.id, // this.AILA_userInfo.id,
    };

    /*
    {
      title: 'No',
      dataIndex: 'keyNumber',
      key: 'keyNumber',
    },
    */
    this.columns = [{
      title: 'Company Name',
      dataIndex: 'name_en',
      key: 'name_en',
      width: '20%',
      render: (strName, recordData) => (
        <span>
          <a onClick={() => this.$editCompany.showModal(recordData, 'view')}>{strName}</a>
        </span>
      )
    }, {
      title: 'Country',
      dataIndex: 'country_name_en',
      key: 'country_name_en',
    }, {
      title: 'City',
      dataIndex: 'city_name_en',
      key: 'city_name_en',
    }, {
      title: 'Audit Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let statusName = status;
        companyStatus.forEach(item => {
          if (item.value === status) {
            statusName = item.label;
            return statusName;
          }
        });
        return statusName;
      }
    }, {
      title: 'Appy Time',
      dataIndex: 'created_time',
      key: 'created_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'Sales',
      dataIndex: 'saler',
      key: 'saler',
    }, {
      title: 'handle',
      dataIndex: 'operation',
      key: 'operation',
      width: '20%',
      render: (id, record) => (
        // 后台修改公司信息保存后，状态改为审核通过3（前提是公司状态为：未激活0, 未审核1, 审核未通过2）；如果公司状态是审核通过3和vip公司4，不能进行修改

        <span>
          <a onClick={() => this.$editCompany.showModal(record, 'edit')}>Edit</a>
          {
            (record.saler === '') &&
            <span>
              <Divider type="vertical" />
              <a onClick={() => this.$companyAssociated.showModal(record)}>Associated</a>
            </span>
          }
          {
            (record.saler !== '') &&
            <span>
              <Divider type="vertical" />
              <a onClick={() => this.CancelSales(record)}>Cancel</a>
            </span>
          }
        </span>
        /*
        <span>
          {
            (record.status === 0 || record.status === 1 || record.status === 2) &&
            <span>
              <a onClick={() => this.$editCompany.showModal(record, 'edit')}>Edit</a>
              <Divider type="vertical" />
              <a onClick={() => this.deleteCompany(record)}>Delete</a>
            </span>
          }
          {
            (record.status === 3) &&
            <a onClick={() => this.deleteCompany(record)}>Delete</a>
          }
        </span>

        */
      )
    }];
  }
  componentDidMount() {
    this.getCompanyList(1, this.state.pageSize);
    this.getCountryList();
    // this.getSalesList();
  }

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
  getCityList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin/api/city/list`,
      method: 'POST',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        country_id: this.search.country_id,
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
        const salesData = [];
        for (let i = 0; i < resData.length; i += 1) {
          salesData.push(
            <Option key={resData[i].id} value={resData[i].id}>{resData[i].username}</Option>
          );
        }
        this.setState({
          salesData
        });
      })
      .catch(() => {
      });
  };

  // 获取列表
  getCompanyList = (page) => {
    console.log(page);
    /*
    let hasSaler = '0';
    const { salesCheckedList } = this.state;
    if (salesCheckedList.length === 1) {
      hasSaler = salesCheckedList[0];
    }
    */

    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/sale_company/list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        ...this.search,
        // has_saler: hasSaler,
        start: page - 1,
        limit: this.state.pageSize,
      }
    })
      .then(res => {
        const resData = res.data;
        console.log(resData);
        const dataArray = [];
        for (let i = 0; i < resData.length; i += 1) {
          dataArray.push({
            ...resData[i],
            key: i + 1 + ((page - 1) * this.state.pageSize),
            keyNumber: `${i + 1 + ((page - 1) * this.state.pageSize)}`,
          });
        }
        console.log(dataArray);
        this.setState({
          loading: false,
          tableData: dataArray,
          current: page,
          tableTotal: res.total,
          selectedRowKeys: [],
        });
      })
      .catch(() => {
      });
  };
  // 列表翻页CompanyEdit.jsx
  pageOnChange = (page, pageSize) => {
    this.setState({
      current: page,
    });
    this.getCompanyList(page, pageSize);
  };

  // 查询条件
  searchOnChange = (value, type) => {
    console.log(value, type);
    switch (type) {
      case 'name_en':
        this.search.name_en = value.target.value;
        break;
      case 'has_saler':
        this.search.has_saler = value;
        if (value === salesArr[0].value) {
          this.search.saler_id = this.AILA_userInfo.id;
        } else {
          this.search.saler_id = '';
        }
        break;
      case 'saler_id':
        this.search.saler_id = value;
        break;
      case 'country_id':
        this.search.country_id = value;
        this.search.city_id = undefined;
        this.setState({
          citySeleteId: this.search.city_id,
        });
        this.getCityList();
        break;
      case 'city_id':
        this.search.city_id = value;
        this.setState({
          citySeleteId: this.search.city_id,
        });
        break;
      default:
        break;
    }
    // this.getCompanyList(1, this.state.pageSize);
  };
  // 时间区间选择确定
  dateOnChange = (moment, dateString) => {
    if (dateString[0] === '') {
      this.search.apply_time_start = '';
      this.search.apply_time_end = '';
    } else {
      // this.search.startDay = moment[0].format('YYYY-MM-DD HH:mm:ss');
      // this.search.endDay = moment[1].format('YYYY-MM-DD HH:mm:ss');
      // format('X'); 时间戳秒   moment[0].valueOf() 毫秒
      this.search.apply_time_start = moment[0].format('X');
      this.search.apply_time_end = moment[1].format('X');
    }
    // this.getCompanyList(1, this.state.pageSize);
  };

  deleteCompany = (record) => {
    console.log(record);
    confirm({
      title: `Are you sure you want to delete 【${record.name_en}】 company?`,
      content: '',
      width: 900,
      // style: { maxWidth: 960 },
      onOk: () => {
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/delete`,
          method: 'POST',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            id: record.id,
          }
        })
          .then(res => {
            if (res.success) {
              this.getCompanyList(1, this.state.pageSize);
              message.success('Delete successfully!');
            } else if (res.message) {
              message.error(res.message);
            } else {
              message.error('Delete failed!');
            }
          })
          .catch((res) => {
            if (res.message) message.error(res.message);
            else message.error('Delete failed!');
          });
      },
      onCancel() {},
    });
  };


  CancelSales = (record) => {
    console.log(record);
    confirm({
      title: `Are you sure you want to cancel 【${record.name_en}】 company you follow?`,
      content: '',
      width: 900,
      // style: { maxWidth: 960 },
      onOk: () => {
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/sale_company/cancel`,
          method: 'POST',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            company_id: record.id,
            saler_id: record.saler_id,
          }
        })
          .then(res => {
            if (res.success) {
              this.getCompanyList(1, this.state.pageSize);
              message.success('Cancel successfully!');
            } else if (res.message) {
              message.error(res.message);
            } else {
              message.error('Cancel failed!');
            }
          })
          .catch((res) => {
            if (res.message) message.error(res.message);
            else message.error('Cancel failed!');
          });
      },
      onCancel() {},
    });
  };

  render() {
    const { loading, current, pageSize, tableData, tableTotal, countryData, cityData, citySeleteId } = this.state;
    return (
      <Layout>
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>CRM</Breadcrumb.Item>
          <Breadcrumb.Item>Customer Management</Breadcrumb.Item>
        </Breadcrumb>
        <Content style={{ background: '#fff', margin: '0 0 20px' }}>
          <div style={{ width: '100%', padding: '15px' }}>
            <div className="searchToolbar">
              <div className="searchToolbar-item" >
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    onChange={value => this.searchOnChange(value, 'country_id')}
                    style={{ width: 200, marginRight: 7 }}
                    placeholder="Country"
                    allowClear
                  >
                    { countryData }
                  </Select>
                </div>
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    value={citySeleteId}
                    onChange={value => this.searchOnChange(value, 'city_id')}
                    style={{ width: 200, marginRight: 7 }}
                    placeholder="City"
                    allowClear
                  >
                    { cityData }
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="Company Name"
                    onChange={value => this.searchOnChange(value, 'name_en')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <Select
                    showSearch
                    defaultValue={'1'}
                    optionFilterProp="children"
                    onChange={value => this.searchOnChange(value, 'has_saler')}
                    style={{ width: 200, marginRight: 7 }}
                    placeholder="Sales"
                    allowClear
                  >
                    {
                      salesArr.map(item => (
                        <Option key={`form-${item.value}`} value={item.value}>{item.label}</Option>
                      ))
                    }
                  </Select>
                </div>
              </div>
              <div className="searchToolbar-btn">
                {/* <Button className="clear" type="primary" onClick={() => this.clearSearch()}>Clear</Button> */}
                <Button type="primary" onClick={() => this.getCompanyList(1, pageSize)}>Search</Button>
              </div>
            </div>
            {/*
            <div className="searchToolbar">
              <div>
                <CheckboxGroup
                  options={salesArr}
                  value={this.state.salesCheckedList}
                  onChange={checkedList => this.setState({ salesCheckedList: checkedList })}
                />
              </div>
            </div>
             */}
            <div className="tablecontent">
              <div className="searchToolbar">
                <div className="searchToolbar-btn">
                </div>
                <div className="searchToolbar-btn">
                  <Button className="rightMargin" type="primary" onClick={() => this.$editCompany.showModal(null, 'add', '0')} >Add</Button>
                </div>
              </div>
              <Table
                loading={loading}
                columns={this.columns}
                dataSource={tableData}
                pagination={{ current, pageSize, total: tableTotal, onChange: (this.pageOnChange) }}
              />
            </div>
            <CompanyEdit onRef={ref => { this.$editCompany = ref; }} onOK={(editId) => { this.getCompanyList(editId ? current : 1, pageSize); }} />
            <CompanyAssociated onRef={ref => { this.$companyAssociated = ref; }} onOK={(editId) => { this.getCompanyList(editId ? current : 1, pageSize); }} />
          </div>
        </Content>
      </Layout>
    );
  }
}

export default CompanyList;
