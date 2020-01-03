import React, { Component } from 'react';
import { Layout, Breadcrumb, Table, Button, Input, Divider } from 'antd';
import AccountEdit from './AccountEdit';
import Utils from '../../common/Utils';

import './systemManage.css';

const { Content } = Layout;


class AccountManagement extends Component {
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
      account: '',
      status: '',
    };

    this.columns = [{
      title: 'No',
      dataIndex: 'key',
      key: 'key',
    }, {
      title: 'Account',
      dataIndex: 'name_en',
      key: 'name_en',
      render: (strName, recordData) => (
        <span>
          <a onClick={() => this.$accountEdit.showModal('view', recordData)}>{strName}</a>
        </span>
      )
    }, {
      title: 'Email',
      dataIndex: 'country_name_en',
      key: 'country_name_en',
    }, {
      title: 'Dept',
      dataIndex: 'city_name_en',
      key: 'city_name_en',
    }, {
      title: 'Role',
      dataIndex: 'name_cn',
      key: 'name_cn',
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
          <a onClick={() => this.$accountEdit.showModal('view', record)}>Edit</a>
          <Divider type="vertical" />
          <a onClick={() => console.log('审核')}>Prohibit</a>
          <Divider type="vertical" />
          <a onClick={() => console.log('设置')}>Set</a>
          <Divider type="vertical" />
          <a onClick={() => this.deleteCompany(record.id)}>Delete</a>
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
  }


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
      case 'account':
        this.search.account = value.target.value;
        break;
      case 'status':
        this.search.status = value;
        break;
      default:
        break;
    }
    // this.getAPIList(1, this.state.pageSize);
  };

  render() {
    const { loading, current, pageSize, tableData, tableTotal } = this.state;
    return (
      <Layout>
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>System Management</Breadcrumb.Item>
          <Breadcrumb.Item>Account Management</Breadcrumb.Item>
        </Breadcrumb>
        <Content style={{ background: '#fff', margin: '0 0 20px' }}>
          <div style={{ width: '100%', padding: '15px' }}>
            <div className="searchToolbar">
              <div className="searchToolbar-item" >
                <div>
                  <Input
                    placeholder="Account"
                    onChange={value => this.searchOnChange(value, 'account')}
                    style={{ width: 300, marginRight: 7 }}
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
                  <Button className="rightMargin" type="primary" onClick={() => this.$accountEdit.showModal()} >Add Account</Button>
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
            <AccountEdit onRef={ref => { this.$accountEdit = ref; }} onOK={() => { this.getAPIList(1, pageSize); }} />
          </div>
        </Content>
      </Layout>
    );
  }
}

export default AccountManagement;
