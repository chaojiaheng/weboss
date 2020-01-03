import React, { Component } from 'react';
import { Layout, Breadcrumb, Table, Select, Button, Input, DatePicker, message, Divider, Modal } from 'antd';
import SourcingRequestCheck from './SourcingRequestCheck';
import Utils from '../../common/Utils';

import './mediaManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

// 状态；审核状态 0-待审核，1-审核通过，2-审核拒绝
const statusList = [
  { label: 'Unaudited', value: 0 },
  { label: 'Confirm', value: 1 },
  { label: 'Refused', value: 2 },
];

class SourcingRequestManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      loading: false,
      current: 1,
      pageSize: 10,
      tableTotal: '',
      tableData: [],
      countryData: [],
      cityData: [],
      citySeleteId: undefined,
    };
    this.search = {
      agency_country_id: '',
      agency_city_id: '',
      company_name: '',
      subject: '',
      status: '',
      start_time: '',
      end_time: '',
    };

    this.columns = [{
      title: 'No',
      dataIndex: 'key',
      key: 'key',
    }, {
      title: 'Cooperative Demand',
      dataIndex: 'subject',
      key: 'subject',
      width: '25%',
      render: (strName, recordData) => (
        <span>
          <a onClick={() => this.$sourcingRequestCheck.showModal('view', recordData)}>{strName}</a>
        </span>
      )
    }, {
      title: 'Country',
      dataIndex: 'country_name',
      key: 'country_name',
    }, {
      title: 'City',
      dataIndex: 'city_name',
      key: 'city_name',
    }, {
      title: 'Company',
      dataIndex: 'company_name_en',
      key: 'company_name_en',
      width: '20%',
    }, {
      title: 'Create time',
      dataIndex: 'created_time',
      key: 'created_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'Valid Time',
      dataIndex: 'valid_time',
      key: 'valid_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let statusName = status;
        statusList.forEach(item => {
          if (item.value === status) {
            statusName = item.label;
            return statusName;
          }
        });
        return statusName;
      }
    }, {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      width: '10%',
      render: (id, record) => (
        <span>
          { record.status === 0 ? <a onClick={() => this.$sourcingRequestCheck.showModal('check', record)}>Check</a> : <span>Check</span> }
          <Divider type="vertical" />
          <a onClick={() => this.deletedSourcingReguest(record)}>Delete</a>
        </span>
      )
    }];

    // rowSelection objects indicates the need for row selection
    this.rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        // const str = selectedRowKeys.toString().split(',');
        console.log(selectedRowKeys);
        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        this.setState({
          selectedRowKeys,
        });
      },
    };

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }
  componentDidMount() {
    this.getAPIList(1, this.state.pageSize);
    this.getCountryList();
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
        country_id: this.search.agency_country_id,
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


  // 获取列表
  getAPIList = (page) => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_demand/api/demand/list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        ...this.search,
        start: page - 1,
        limit: this.state.pageSize,
      }
    })
      .then(res => {
        const resData = res.data;
        const dataArray = [];
        for (let i = 0; i < resData.length; i += 1) {
          dataArray.push({
            ...resData[i],
            key: `${i + 1 + ((this.state.current - 1) * this.state.pageSize)}`,
          });
        }
        console.log(dataArray);
        this.setState({
          loading: false,
          tableData: dataArray,
          tableTotal: res.total,
          current: page,
        });
      })
      .catch(() => {
      });
  };
  // 列表翻页
  pageOnChange = (page, pageSize) => {
    this.setState({
      current: page,
    });
    this.getAPIList(page, pageSize);
  };


  // 查询条件
  searchOnChange = (value, type) => {
    console.log(value, type);
    switch (type) {
      case 'country_id':
        this.search.agency_country_id = value;
        this.search.agency_city_id = undefined;
        this.setState({
          citySeleteId: this.search.agency_city_id,
        });
        this.getCityList();
        break;
      case 'city_id':
        this.search.agency_city_id = value;
        this.setState({
          citySeleteId: this.search.agency_city_id,
        });
        break;
      case 'company_name_en':
        this.search.company_name = value.target.value;
        break;
      case 'subject':
        this.search.subject = value.target.value;
        break;
      case 'status':
        this.search.status = value;
        break;
      default:
        break;
    }
    // this.getAPIList(1, this.state.pageSize);
  };

  // 时间区间选择确定
  dateOnChange = (moment, dateString) => {
    if (dateString[0] === '') {
      this.search.start_time = '';
      this.search.end_time = '';
    } else {
      this.search.start_time = moment[0].format('X');
      this.search.end_time = moment[1].format('X');
    }
  };

  // 删除询盘
  deletedSourcingReguest = (record) => {
    confirm({
      title: `Are you sure you want to delete the 【${record.subject}】 enquiry data?`,
      content: '',
      width: 960,
      // style: { maxWidth: 960 },
      onOk: () => {
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_demand/api/demand/save`,
          method: 'POST',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            id: record.id,
            deleted: 1,
          }
        })
          .then(res => {
            if (res.success) {
              this.getAPIList(1, this.state.pageSize);
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

  render() {
    const { loading, current, pageSize, tableData, tableTotal, countryData, cityData, citySeleteId } = this.state;
    return (
      <Layout>
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>The management of media assets</Breadcrumb.Item>
          <Breadcrumb.Item>Sourcing Request Management</Breadcrumb.Item>
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
                    placeholder="Company"
                    onChange={value => this.searchOnChange(value, 'company_name_en')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <RangePicker
                    showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['Mix Create Time', 'Max Create Time']}
                    onChange={this.dateOnChange} style={{ marginRight: 7 }}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Cooperative Demand"
                    onChange={value => this.searchOnChange(value, 'subject')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    onChange={value => this.searchOnChange(value, 'status')}
                    style={{ width: 180, marginRight: 7 }}
                    placeholder="Status"
                    allowClear
                  >
                    { statusList.map(item => (
                      <Option key={item.value} value={item.value}>{item.label}</Option>
                    )) }
                  </Select>
                </div>
              </div>
              <div className="searchToolbar-btn">
                <Button type="primary" onClick={() => this.getAPIList(1, pageSize)}>Search</Button>
              </div>
            </div>
            <div className="tablecontent">
              <Table
                loading={loading}
                columns={this.columns}
                rowSelection={this.rowSelection}
                dataSource={tableData}
                pagination={{ current, pageSize, total: tableTotal, onChange: (this.pageOnChange) }}
              />
            </div>
            <SourcingRequestCheck onRef={ref => { this.$sourcingRequestCheck = ref; }} onOK={() => { this.getAPIList(current, pageSize); }} />
          </div>
        </Content>
      </Layout>
    );
  }
}

export default SourcingRequestManagement;
