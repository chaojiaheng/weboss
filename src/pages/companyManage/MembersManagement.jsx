import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Layout, Table, Button, Input, Divider, Select, DatePicker, message, Modal } from 'antd';
import MembersEdit from './MembersEdit';
import Utils from '../../common/Utils';

import './companyManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

// 用户类型 '用户类型 1-主账号，2-子账号',
const companyUserTypeList = [
  { label: 'Main Account', value: 1 },
  { label: 'Sub Account', value: 2 },
];
// '账号状态 0-未激活，1-已激活',
const statusList = [
  { label: 'Unactivated', value: 0 },
  { label: 'Activated', value: 1 },
];
class MembersManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
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
      // company_name: '',
      username: '',
      type: '',
      status: '',
      created_time_start: '',
      created_time_end: '',
    };

    this.companyId = '';
    this.companyData = null;
    this.columns = [{
      title: 'No',
      dataIndex: 'key',
      key: 'key',
    }, {
      title: 'Name',
      dataIndex: 'username',
      key: 'username',
      render: (strName, recordData) => (
        <span>
          <a onClick={() => this.$membersEdit.showModal('view', recordData)}>{strName}</a>
        </span>
      )
    }, {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    }, {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    }, {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: uType => {
        let userTypeName = uType;
        companyUserTypeList.forEach(item => {
          if (item.value === uType) {
            userTypeName = item.label;
            return userTypeName;
          }
        });
        return userTypeName;
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
      title: 'Create time',
      dataIndex: 'created_time',
      key: 'created_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      render: (id, record) => (
        <span>
          {
            record.type === companyUserTypeList[1].value &&
            <span>
              <a onClick={() => this.setUserToMain(record)}>Set Main Account</a>
              <Divider type="vertical" />
            </span>
          }
          <a onClick={() => this.$membersEdit.showModal('edit', record)}>Edit</a>
          <Divider type="vertical" />
          <a onClick={() => this.deleteUser(record.id)}>Delete</a>
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
    console.log(document.body.clientWidth);
    this.membersManagePageWidth = (document.body.clientWidth - 200) < 1280 ? 1280 : (document.body.clientWidth - 200);
    console.log(this.membersManagePageWidth);
    this.membersManagePageWidth = this.membersManagePageWidth > document.body.clientWidth ? (document.body.clientWidth - 40) : this.membersManagePageWidth;
    console.log(this.membersManagePageWidth);
  }
  componentDidMount() {
    this.props.onRef(this);
  }

  // 设置主用户
  setUserToMain = (record) => {
    if (this.companyData.status !== 4) {
      confirm({
        title: 'The company is not VIP!',
        content: 'Please set the company as VIP first.',
        onOk: () => {
        },
        onCancel() {},
      });
    } else {
      this.$membersEdit.showModal('setMainAccount', record);
    }
    // this.$membersEdit.showModal('setMainAccount', record);
  };

  // 获取列表
  getAPIList = (page) => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/user`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        company_id: this.companyId,
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

  // 弹出框处理函数
  showModal = (record) => {
    console.log(record);
    this.companyId = '';
    this.setState({
      modalVisible: true,
    });

    if (record) {
      this.companyId = record.id;
      this.companyData = record;
      this.getAPIList(1, this.state.pageSize);
    }
  };
  modalCancel = () => {
    this.setState({
      modalVisible: false,
    });
    this.companyId = '';
    this.companyData = null;
  };


  // 查询条件
  searchOnChange = (value, type) => {
    console.log(value, type);
    switch (type) {
      case 'company_name':
        this.search.company_name = value.target.value;
        break;
      case 'username':
        this.search.username = value.target.value;
        break;
      case 'user_type':
        this.search.type = value;
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
      this.search.created_time_start = '';
      this.search.created_time_end = '';
    } else {
      this.search.created_time_start = moment[0].format('X');
      this.search.created_time_end = moment[1].format('X');
    }
  };

  // 删除用户
  deleteUser = (userId) => {
    confirm({
      title: 'Are you sure you want to delete the user?',
      content: '',
      onOk: () => {
        Utils.request({
          url: `${window.PAY_API_HOST}/baseapi/admin_user/api/user/save`,
          method: 'POST',
          headers: {
            token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
          },
          data: {
            user_id: userId,
            deleted: 1,
          }
        })
          .then(res => {
            if (res.success) {
              this.getAPIList(1, this.state.pageSize);
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
    const { modalVisible, loading, current, pageSize, tableData, tableTotal } = this.state;
    return (
      <Modal
        title="Members Management"
        visible={modalVisible}
        onCancel={this.modalCancel}
        footer={[]}
        destroyOnClose
        width={this.membersManagePageWidth}
      >
        <Layout>
          {/*
          <Breadcrumb style={{ margin: '12px 0' }}>
            <Breadcrumb.Item>Company Management</Breadcrumb.Item>
            <Breadcrumb.Item>Members Management</Breadcrumb.Item>
          </Breadcrumb>
          */}
          <Content style={{ background: '#fff', margin: '0 0 20px' }}>
            <div style={{ width: '100%', padding: '15px' }}>
              <div className="searchToolbar">
                <div className="searchToolbar-item" >
                  {/*
                  <div>
                    <Input
                      placeholder="Company name"
                      onChange={value => this.searchOnChange(value, 'company_name')}
                      style={{ width: 300, marginRight: 7 }}
                    />
                  </div>
                  */}
                  <div>
                    <Input
                      placeholder="user"
                      onChange={value => this.searchOnChange(value, 'username')}
                      style={{ width: 300, marginRight: 7 }}
                    />
                  </div>
                  <div>
                    <Select
                      showSearch
                      optionFilterProp="children"
                      onChange={value => this.searchOnChange(value, 'user_type')}
                      style={{ width: 180, marginRight: 7 }}
                      placeholder="Type"
                      allowClear
                    >
                      { companyUserTypeList.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      )) }
                    </Select>
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
                  <div>
                    <RangePicker
                      showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['Mix Create Time', 'Max Create Time']}
                      onChange={this.dateOnChange} style={{ marginRight: 7 }}
                    />
                  </div>
                </div>
                <div className="searchToolbar-btn">
                  <Button type="primary" onClick={() => this.getAPIList(1, pageSize)}>Search</Button>
                </div>
              </div>
              <div className="tablecontent">
                <div className="searchToolbar">
                  <div className="searchToolbar-btn">
                  </div>
                  <div className="searchToolbar-btn">
                    <Button className="rightMargin" type="primary" onClick={() => this.$membersEdit.showModal('add', null, this.companyData)} >Add</Button>
                  </div>
                </div>
                <Table
                  loading={loading}
                  columns={this.columns}
                  rowSelection={this.rowSelection}
                  dataSource={tableData}
                  pagination={{ current, pageSize, total: tableTotal, onChange: (this.pageOnChange) }}
                />
              </div>
              <MembersEdit onRef={ref => { this.$membersEdit = ref; }} onOK={() => { this.getAPIList(current, pageSize); }} />
            </div>
          </Content>
        </Layout>
      </Modal>
    );
  }
}
MembersManagement.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};
export default MembersManagement;
