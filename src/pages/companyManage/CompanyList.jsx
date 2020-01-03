import React, { Component } from 'react';
import { Layout, Breadcrumb, Table, Select, Button, Input, DatePicker, Divider, message, Modal, Checkbox } from 'antd';
import CompanyEdit from './CompanyEdit';
import CompanySetVIP from './CompanySetVIP';
import CompanyEditVIP from './CompanyEditVIP';
import CompanyAudit from './CompanyAudit';
import MembersManagement from './MembersManagement';
import CompanyRelatedSet from './CompanyRelatedSet';
// import CompanyRelatedView from './CompanyRelatedView';
import Utils from '../../common/Utils';

import './companyManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { RangePicker } = DatePicker;
const { confirm } = Modal;
const CheckboxGroup = Checkbox.Group;

/**
 公司状态 0-未审核，              1-审核通过（普通公司），   2-审核未通过，    3-vip公司（或者aila认证），  4-未激活
          0-pending approval      1- approved                2- rejected       3-VIP Company                4-unactivated


 1、默认导入了10万左右的公司数据，status（状态）默认为4（未激活）；
 2、后台可以对状态为：未激活, 未审核, 审核未通过   的公司进行审核，审核通过后状态改为：审核通过
 3、后台修改公司信息保存后，状态改为审核通过（前提是公司状态为：未激活, 未审核, 审核未通过）；如果公司状态是审核通过和vip公司，不能进行修改

 1、公司状态（status）
 修改前：公司状态 0-未审核，1-审核通过（普通公司），2-审核未通过，3-vip公司，4-未激活
 修改后：0-未激活，      1-未审核，              2-审核未通过，    3-审核通过（普通公司），4-vip公司
         0-Unactivated   1- Pending Approval     2- Rejected       3-Approved              4-VIP Company

 */
const companyStatus = [
  { label: 'Unactivated', value: 0 },
  { label: 'Pending Approval', value: 1 },
  { label: 'Rejected', value: 2 },
  { label: 'Approved', value: 3 },
  { label: 'VIP Company', value: 4 },
];

// Trading co. 贸易公司  Freight forwarders 货代公司
// const companyType = [
//   { label: 'Freight forwarders', value: 1 },
//   { label: 'Trading co.', value: 2 },
// ];

// 公司级别 level  公司状态company_level：0-没有状态，1-⼦子公司，2-总公司
// const companyLevel = [
//   { label: '-', value: 0 },
//   { label: 'Branch Office', value: 1 },
//   { label: 'Head Office', value: 2 },
// ];
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
      ProhibitBtnDisabled: false, // 禁用批量按钮 状态
      AuditBtnDisabled: false, // 审核批量按钮 状态
      SetAILAVIPBtnDisabled: false, // 设置vip批量按钮 状态
      companyStatusCheckedList: companyStatus.map(item => item.value), // 搜索 公司状态
    };
    this.search = {
      name_en: '',
      ctype: '',
      country_id: '',
      city_id: '',
      apply_time_start: '',
      apply_time_end: '',
    };

    this.columns = [{
      title: 'No',
      dataIndex: 'keyNumber',
      key: 'keyNumber',
    }, {
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
      title: '公司中文名',
      dataIndex: 'name_cn',
      key: 'name_cn',
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
      title: 'Update Time',
      dataIndex: 'updated_time',
      key: 'updated_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'handle',
      dataIndex: 'operation',
      key: 'operation',
      width: '20%',
      render: (id, record) => (
        // 后台修改公司信息保存后，状态改为审核通过3（前提是公司状态为：未激活0, 未审核1, 审核未通过2）；如果公司状态是审核通过3和vip公司4，不能进行修改
        <span>
          <a onClick={() => this.$membersManagement.showModal(record)}>Members</a>
          <Divider type="vertical" />
          {
            (record.status === 0 || record.status === 1 || record.status === 2) &&
            <span>
              <a onClick={() => this.$editCompany.showModal(record, 'edit')}>Edit</a>
              <Divider type="vertical" />
              <a onClick={() => this.$auditCompany.showModal(record)}>Audit</a>
              <Divider type="vertical" />
            </span>
          }
          {/*
            record.status !== 0 &&
            <span>
              <a onClick={() => this.auditCompany(record.id, 4)}>Prohibit</a>
              <Divider type="vertical" />
            </span>
            */
          }
          {
            record.status === 3 &&
            <span>
              <a onClick={() => this.$setCompanyVIP.showModal(record)}>Set AILA</a>
              <Divider type="vertical" />
            </span>
          }
          {
            record.status === 4 &&
            <span>
              <a onClick={() => this.$companyEditVIP.showModal(record)}>Edit AILA</a>
              <Divider type="vertical" />
            </span>
          }
          <a onClick={() => this.deleteCompany(record)}>Delete</a>
          <Divider type="vertical" />
          <a onClick={() => this.$companyRelatedSet.showModal(record)}>Related</a>
        </span>
      )
    }];

    /*
    {
      title: 'Company Type',
      dataIndex: 'ctype',
      key: 'ctype',
      render: (record) => {
        // console.log(record);
        let typeName = record;
        companyType.forEach(item => {
          if (item.value === record) {
            typeName = item.label;
            return typeName;
          }
        });
        return typeName;
      }
    },
    {
      title: 'Company Level',
      dataIndex: 'level',
      key: 'level',
      render: (record) => {
        // console.log(record);
        let levelName = record;
        companyLevel.forEach(item => {
          if (item.value === record) {
            levelName = item.label;
            return levelName;
          }
        });
        return levelName;
      }
    },
    */
    // rowSelection objects indicates the need for row selection
    // this.rowSelection = {};

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }
  componentDidMount() {
    this.getCompanyList(1, this.state.pageSize);
    this.getCountryList();
  }

  // 表格选择处理函数
  onChangeRowSelection = (selectedRowKeys, selectedRows) => {
    // const str = selectedRowKeys.toString().split(',');
    let ProhibitBtnDisabled = false; // status 没有 4的时候可以
    let AuditBtnDisabled = false; // status 没有 1 3 的可以
    let SetAILAVIPBtnDisabled = false; // status 都是 1 的时候可以
    console.log(selectedRowKeys);
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    const selectedRowsId = [];
    selectedRows.forEach(item => {
      selectedRowsId.push(item.id);
      if (item.status === 4) {
        ProhibitBtnDisabled = true;
        SetAILAVIPBtnDisabled = true;
      }
      if (item.status === 1 || item.status === 3) {
        AuditBtnDisabled = true;
      }
      if (item.status === 0 || item.status === 2) {
        SetAILAVIPBtnDisabled = true;
      }
    });
    this.setState({
      selectedRowKeys,
      selectedRowsId,
      ProhibitBtnDisabled,
      AuditBtnDisabled,
      SetAILAVIPBtnDisabled,
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


  // 获取列表
  getCompanyList = (page) => {
    console.log(page);
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        // sort: 'createTime',
        // order: 'desc',
        ...this.search,
        status: this.state.companyStatusCheckedList ? this.state.companyStatusCheckedList : [],
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
  // 列表翻页
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
      case 'ctype':
        this.search.ctype = value;
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
  clearSearch = () => {
    this.search = {
      name_en: '',
      ctype: '',
      startDay: '',
      endDay: '',
    };
    this.getCompanyList(1);
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

  // 设置vip3  审核 status 1  禁用  4
  auditCompany = (compayyIds, status) => {
    let titleStr = 'Are you sure you want to pass these companies?';
    if (status === 3) {
      titleStr = 'Are you sure you want to make these companies VIP?';
    } else if (status === 4) {
      titleStr = 'Are you sure you want to ban these companies?';
    }
    confirm({
      title: titleStr,
      content: '',
      onOk: () => {
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/audit`,
          method: 'POST',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            company_ids: compayyIds,
            status,
          }
        })
          .then(res => {
            if (res.success) {
              this.getCompanyList(1, this.state.pageSize);
              message.success('Modified success!');
            }
          })
          .catch((res) => {
            message.error(res.message);
          });
      },
      onCancel() {},
    });
  };

  render() {
    const { loading, current, pageSize, tableData, tableTotal, countryData, cityData, citySeleteId,
      selectedRowKeys } = this.state;
    // console.log(citySeleteId); // ProhibitBtnDisabled, AuditBtnDisabled, SetAILAVIPBtnDisabled, selectedRowsId
    return (
      <Layout>
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>Company Management</Breadcrumb.Item>
          <Breadcrumb.Item>Company Information Management</Breadcrumb.Item>
        </Breadcrumb>
        <Content style={{ background: '#fff', margin: '0 0 20px' }}>
          <div style={{ width: '100%', padding: '15px' }}>
            <div className="searchToolbar">
              <div className="searchToolbar-item" >
                <div>
                  <Input
                    placeholder="Company Name"
                    onChange={value => this.searchOnChange(value, 'name_en')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <RangePicker
                    showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['Mix Apply Time', 'Max Apply Time']}
                    onChange={this.dateOnChange} style={{ marginRight: 7 }}
                  />
                </div>
                {/*
                <div>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    onChange={value => this.searchOnChange(value, 'ctype')}
                    style={{ width: 180, marginRight: 7 }}
                    placeholder="Company Type"
                    allowClear
                  >
                    { companyType.map(item => (
                      <Option key={item.value} value={item.value}>{item.label}</Option>
                    )) }
                  </Select>
                </div>
                */}
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
              </div>
              <div className="searchToolbar-btn">
                {/* <Button className="clear" type="primary" onClick={() => this.clearSearch()}>Clear</Button> */}
                <Button type="primary" onClick={() => this.getCompanyList(1, pageSize)}>Search</Button>
              </div>
            </div>
            <div className="searchToolbar">
              <div>
                <CheckboxGroup
                  options={companyStatus}
                  value={this.state.companyStatusCheckedList}
                  onChange={checkedList => this.setState({ companyStatusCheckedList: checkedList })}
                />
                {/*
                <CheckboxGroup >
                  <Row className="roleP-checkbox-row">
                    {
                      companyStatus.map(item => (
                        <Checkbox key={item.value} value={item.value} >{item.label}</Checkbox>
                      ))
                    }
                  </Row>
                </CheckboxGroup>
                */}
              </div>
            </div>

            <div className="tablecontent">
              <div className="searchToolbar">
                <div className="searchToolbar-btn">
                  {/*
                  <Button
                    className="rightMargin" type="primary" disabled={(ProhibitBtnDisabled || selectedRowKeys.length === 0)}
                    onClick={() => this.auditCompany(selectedRowsId.join(','), 4)}
                  >Prohibit</Button>
                  <Button
                    className="rightMargin" type="primary" disabled={(AuditBtnDisabled || selectedRowKeys.length === 0)}
                    onClick={() => this.auditCompany(selectedRowsId.join(','), 1)}
                  >Audit</Button>
                  <Button
                    type="primary" disabled={(SetAILAVIPBtnDisabled || selectedRowKeys.length === 0)}
                    onClick={() => this.auditCompany(selectedRowsId.join(','), 3)}
                  >Set AILA</Button>
                  */}
                </div>
                <div className="searchToolbar-btn">
                  <Button className="rightMargin" type="primary" onClick={() => this.$editCompany.showModal(null, 'add')} >Add</Button>
                  {/* <Button type="primary" onClick={() => this.getAppUpgradeList('1', '10')}>导入</Button> */}
                  {/* <Button className="rightMargin" type="primary" onClick={() => this.$companyRelatedSet.showModal()} >Set Related</Button> */}
                </div>
              </div>
              <Table
                loading={loading}
                columns={this.columns}
                rowSelection={{ onChange: this.onChangeRowSelection, selectedRowKeys }}
                dataSource={tableData}
                pagination={{ current, pageSize, total: tableTotal, onChange: (this.pageOnChange) }}
              />
            </div>
            <CompanyEdit onRef={ref => { this.$editCompany = ref; }} onOK={(editId) => { this.getCompanyList(editId ? current : 1, pageSize); }} />
            <CompanySetVIP onRef={ref => { this.$setCompanyVIP = ref; }} onOK={() => { this.getCompanyList(current, pageSize); }} />
            <CompanyAudit onRef={ref => { this.$auditCompany = ref; }} onOK={() => { this.getCompanyList(current, pageSize); }} />
            <MembersManagement onRef={ref => { this.$membersManagement = ref; }} onOK={() => { }} />
            <CompanyRelatedSet onRef={ref => { this.$companyRelatedSet = ref; }} onOK={() => { this.getCompanyList(current, pageSize); }} />
            <CompanyEditVIP onRef={ref => { this.$companyEditVIP = ref; }} onOK={() => { this.getCompanyList(current, pageSize); }} />
            {/* <CompanyRelatedView onRef={ref => { this.$companyRelatedView = ref; }} onOK={() => { }} /> */}
          </div>
        </Content>
      </Layout>
    );
  }
}

export default CompanyList;
