import React, { Component } from 'react';
import { Layout, Breadcrumb, Table, Select, Button, Input, DatePicker } from 'antd';
import MailCheck from './MailCheck';
import Utils from '../../common/Utils';

import './mediaManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { RangePicker } = DatePicker;

// 状态；审核状态 0-待审核，1-审核通过，2-审核拒绝
const statusList = [
  { label: 'Unaudited', value: 0 },
  { label: 'Confirm', value: 1 },
  { label: 'Refused', value: 2 },
];

class MailList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      loading: false,
      current: 1,
      pageSize: 10,
      tableTotal: '',
      tableData: [],
    };
    this.search = {
      from: '',
      to: '',
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
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: '15%',
      render: (strName, recordData) => (
        <span>
          <a onClick={() => this.mMailCheck.showModal('view', recordData)}>{strName}</a>
        </span>
      )
    }, {
      title: 'Sender',
      dataIndex: 'from_name',
      key: 'from_name',
    }, {
      title: 'Receiver',
      dataIndex: 'to_name',
      key: 'to_name',
    }, {
      title: 'Message Status',
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
      title: 'Send time',
      dataIndex: 'created_time',
      key: 'created_time',
      render: record => {
        return Utils.formatTime(record);
      }
    }, {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      width: '20%',
      render: (id, record) => (
        <span>
          { record.status === 0 ? <a onClick={() => this.mMailCheck.showModal('check', record)}>Check</a> : <p>Check</p> }
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
      url: `${window.PAY_API_HOST}/baseapi/admin_mail/api/mail/list`,
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
      case 'from_company_name_en':
        this.search.from = value.target.value;
        break;
      case 'to_company_name_en':
        this.search.to = value.target.value;
        break;
      case 'subject':
        this.search.subject = value.target.value;
        break;
      case 'status':
        this.search.status = value;
        console.log(this.search.status);
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


  render() {
    const { loading, current, pageSize, tableData, tableTotal } = this.state;
    return (
      <Layout>
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>The management of media assets</Breadcrumb.Item>
          <Breadcrumb.Item>Message Mangement</Breadcrumb.Item>
        </Breadcrumb>
        <Content style={{ background: '#fff', margin: '0 0 20px' }}>
          <div style={{ width: '100%', padding: '15px' }}>
            <div className="searchToolbar">
              <div className="searchToolbar-item" >
                <div>
                  <Input
                    placeholder="Sender Company"
                    onChange={value => this.searchOnChange(value, 'from_company_name_en')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Receiver Company"
                    onChange={value => this.searchOnChange(value, 'to_company_name_en')}
                    style={{ width: 300, marginRight: 7 }}
                  />
                </div>
                <div>
                  <RangePicker
                    showTime format="YYYY-MM-DD HH:mm:ss" placeholder={['Mix Send Time', 'Max Send Time']}
                    onChange={this.dateOnChange} style={{ marginRight: 7 }}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Subject"
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
                    placeholder="Message Status"
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
            <MailCheck onRef={ref => { this.mMailCheck = ref; }} onOK={() => { this.getAPIList(current, pageSize); }} />
          </div>
        </Content>
      </Layout>
    );
  }
}

export default MailList;
