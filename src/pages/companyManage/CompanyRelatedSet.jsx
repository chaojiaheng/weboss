import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Layout, Table, Button, Select, Modal, Divider, message, Spin } from 'antd';
import debounce from 'lodash/debounce';
import Utils from '../../common/Utils';
import './companyManage.css';

const { Content } = Layout;
const Option = Select.Option;
const { confirm } = Modal;

// 公司级别 level  公司状态     company_level：0-没有状态，  1-子公司，  2-总公司
const companyLevel = [
  { label: '-', value: 0 },
  { label: 'Branch Office', value: 1 },
  { label: 'Head Office', value: 2 },
];

class CompanyRelatedSet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      confirmLoading: false,
      selectedRowKeys: [],
      loading: false,
      current: 1,
      pageSize: 10,
      tableTotal: '',
      tableData: [],
      countryData: [],
      cityData: [],
      citySeleteId: undefined,
      currentCompanyData: [],
      getCompanyIng: false,
      companyList: [],
    };
    this.search = {
      name_en: '',
      country_id: '',
      city_id: '',
    };
    this.getCompanyListSearch = debounce(this.getCompanyList, 500);

    this.companyId = '';
    this.parentId = '';
    const columnInit = [{
      title: 'No',
      dataIndex: 'key',
      key: 'key',
    }, {
      title: 'Company Name',
      dataIndex: 'name_en',
      key: 'name_en',
      width: '45%',
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
    }];
    this.currentColumns = columnInit.concat([{
      title: 'handle',
      dataIndex: 'operation',
      key: 'operation',
      width: '20%',
      render: (id, record) => (
        <span>
          {
            record.level === 2 &&
            <a onClick={() => this.onSetCurrentTableCompanyLevelToBranch(record)}>Set Branch Office</a>
          }
          {
            record.level !== 2 &&
            <a onClick={() => this.onSetCurrentTableCompanyLevelToHead(record)}>Set Head Office</a>
          }
        </span>
      )
    }]);
    this.columns = columnInit.concat([{
      title: 'handle',
      dataIndex: 'operation',
      key: 'operation',
      width: '20%',
      render: (id, record) => (
        <span>
          <a onClick={() => this.onSetCompanyLevel(record)}>{ record.level === 2 ? 'Set Branch Office' : 'Set Head Office' }</a>
          <Divider type="vertical" />
          <a onClick={() => this.deleteBranchLevelCompany(record)}>Delete</a>
        </span>
      )
    }]);

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
    this.pageWidth = (document.body.clientWidth - 200) < 1280 ? 1280 : (document.body.clientWidth - 200);
    console.log(this.pageWidth);
    this.pageWidth = this.pageWidth > document.body.clientWidth ? (document.body.clientWidth - 40) : this.pageWidth;
    console.log(this.pageWidth);
  }
  componentDidMount() {
    this.props.onRef(this);
    this.getCountryList();
  }

  onSeachrComppany = (value) => {
    console.log(value);
    console.log(this.search);
    this.search.name_en = value;
    this.getCompanyListSearch();
  };

  // 设置 当前公司列表 公司级别 为 子公司
  onSetCurrentTableCompanyLevelToBranch = (record) => {
    const { tableData, currentCompanyData } = this.state;
    if (record.key === 1) {
      // 当前选择的公司
      currentCompanyData[0].level = 1;
      this.setState({
        currentCompanyData,
      });
    } else if (record.key === 2) {
      // 主公司更改为子公司
      confirm({
        title: `Are you sure you want 【${currentCompanyData[0].name_en}】 to be the Head Office?`,
        content: '',
        width: 900,
        // style: { maxWidth: 960 },
        onOk: () => {
          currentCompanyData[1].key = tableData.length + 1;
          currentCompanyData[1].level = 1;
          tableData.push(currentCompanyData[1]);
          currentCompanyData.splice(1, 1);
          this.setState({
            tableData,
            currentCompanyData,
          });
        },
        onCancel() {},
      });
    }
  };
  //  设置为 为主公司/母公司
  onSetCurrentTableCompanyLevelToHead = (record) => {
    const { tableData, currentCompanyData } = this.state;
    if (record.key === 1) {
      // 当前选择的公司
      confirm({
        title: `Are you sure you want 【${currentCompanyData[0].name_en}】 to be the Head Office?`,
        content: '',
        width: 900,
        // style: { maxWidth: 960 },
        onOk: () => {
          currentCompanyData[0].level = 2;
          if (currentCompanyData.length === 2) {
            currentCompanyData[1].key = tableData.length + 1;
            currentCompanyData[1].level = 1;
            tableData.push(currentCompanyData[1]);
            currentCompanyData.splice(1, 1);
          }
          this.setState({
            tableData,
            currentCompanyData,
          });
        },
        onCancel() {},
      });
    }
  };
  // 设置 子公司列表 公司级别 为主公司
  onSetCompanyLevel = (record) => {
    const { tableData, currentCompanyData } = this.state;
    if (record.level !== 2) {
      confirm({
        title: `Are you sure you want 【${currentCompanyData[currentCompanyData.length - 1].name_en}】 to be the Head Office?`,
        content: '',
        width: 900,
        // style: { maxWidth: 960 },
        onOk: () => {
          tableData.splice((record.key - 1), 1);
          if (currentCompanyData.length === 2) {
            tableData.push(currentCompanyData[1]);
          }
          tableData.forEach((item, index) => {
            item.key = index + 1;
          });
          console.log(tableData);
          record.key = 2;
          record.level = 2; // 设为主公司
          currentCompanyData[0].level = 1; // 当前选择的公司设为子公司
          currentCompanyData[1] = record;
          this.setState({
            tableData,
            currentCompanyData,
          });
        },
        onCancel() {},
      });
    }
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
  getCompanyList = () => {
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        // name_en: nameEn,
        ...this.search,
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

  // 获取列表
  getAPIList = () => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/ralated/list`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
        //   'Content-Type': 'application/json',
      },
      data: {
        company_id: this.companyId,
        parent_id: this.parentId,
        nopage: 1,
      }
    })
      .then(res => {
        const resData = res.data;
        const dataArray = [];
        const { currentCompanyData } = this.state;
        if (resData.length > 0 && resData[0].level === 2) {
          currentCompanyData[1] = resData.shift();
          currentCompanyData[1].key = 2;
        }
        for (let i = 0; i < resData.length; i += 1) {
          dataArray.push({
            ...resData[i],
            key: i + 1,
          });
        }
        console.log(dataArray);
        this.setState({
          loading: false,
          tableData: dataArray,
          tableTotal: res.total,
          currentCompanyData,
        });
      })
      .catch(() => {
      });
  };

  // 弹出框处理函数
  showModal = (record) => {
    console.log(record);
    this.companyId = record.id;
    this.parentId = record.parent_id;
    record.key = 1;
    this.setState({
      modalVisible: true,
      currentCompanyData: [record],
    });

    this.getCompanyListSearch('');
    this.getAPIList(1, this.state.pageSize);
  };
  modalCancel = () => {
    this.companyId = '';
    this.parentId = '';
    this.setState({
      modalVisible: false,
      confirmLoading: false,
      currentCompanyData: [],
      citySeleteId: undefined,
      companySeleteId: undefined,
    });
  };

  // 查询条件
  searchOnChange = (value, type) => {
    console.log(value, type);
    switch (type) {
      case 'country_id':
        this.search.country_id = value;
        this.search.city_id = undefined;
        this.search.name_en = undefined;
        this.setState({
          citySeleteId: this.search.city_id,
          companySeleteId: undefined,
        });
        this.getCityList();
        this.getCompanyListSearch();
        break;
      case 'city_id':
        this.search.city_id = value;
        this.search.name_en = undefined;
        this.setState({
          citySeleteId: this.search.city_id,
          companySeleteId: undefined,
        });
        this.getCompanyListSearch();
        break;
      case 'name_en':
        this.setState({
          companySeleteId: value,
        });
        break;
      default:
        break;
    }
  };

  deleteBranchLevelCompany = (record) => {
    const { tableData } = this.state;
    confirm({
      title: `Are you sure you delete 【${record.name_en}】 be the Branch Office?`,
      content: '',
      width: 900,
      // style: { maxWidth: 960 },
      onOk: () => {
        tableData.splice((record.key - 1), 1);
        tableData.forEach((item, index) => {
          item.key = index + 1;
        });
        this.setState({
          tableData,
        });
      },
      onCancel() {},
    });
  };

  addCompay = () => {
    const { tableData, currentCompanyData, companySeleteId, companyList } = this.state;
    let isAdded = false;
    let addCompayData = null;
    // 判断
    tableData.forEach(item => {
      if (item.id === companySeleteId) {
        isAdded = true;
        return false;
      }
    });
    currentCompanyData.forEach(item => {
      if (item.id === companySeleteId) {
        isAdded = true;
        return false;
      }
    });
    if (isAdded) {
      message.error('Please don\'t add it again!');
      return false;
    }

    // add
    companyList.forEach(item => {
      if (item.id === companySeleteId) {
        addCompayData = item;
        return false;
      }
    });
    const addTo = () => {
      addCompayData.key = tableData.length + 1;
      addCompayData.level = 1; // 设为子公司
      tableData.push(addCompayData);
      this.setState({
        tableData,
      });
    };
    if (addCompayData.level === 2) {
      confirm({
        title: `【${addCompayData.name_en}】 company is the Head Office! Will 【${addCompayData.name_en}】 be the Branch Office?`,
        content: '',
        width: 900,
        // style: { maxWidth: 960 },
        onOk: () => {
          addTo();
        },
        onCancel() {},
      });
    } else {
      addTo();
    }
  };
  handleSubmit = (e) => {
    console.log('handleSubmit');
    e.preventDefault();
    const { tableData, currentCompanyData } = this.state;
    this.setState({
      confirmLoading: true,
    });

    let majorIdTmp = currentCompanyData[0].id;
    const branchIds = tableData.map(item => (item.id));
    if (currentCompanyData.length === 2) {
      majorIdTmp = currentCompanyData[1].id;
      branchIds.push(currentCompanyData[0].id);
    }
    if (branchIds.length === 0) {
      message.error('The Branch Office should not be empty!');
      return;
    }
    // 修改
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/ralated/save`,
      method: 'post',
      headers: {
        token: this.AILA_userInfo ? this.AILA_userInfo.access_token : '',
      },
      data: {
        major_id: majorIdTmp,
        branch_ids: branchIds.join(','),
      }
    })
      .then(res => {
        if (res && res.success) {
          this.modalCancel();
          message.success('Success');
          this.props.onOK();
        }
      })
      .catch(() => {
        this.modalCancel();
        message.error('Fail');
      });
  };

  render() {
    const { modalVisible, confirmLoading, loading, tableData, countryData, cityData, citySeleteId, currentCompanyData, getCompanyIng, companyList, companySeleteId } = this.state;
    return (
      <Modal
        title="Members Management"
        visible={modalVisible}
        confirmLoading={confirmLoading}
        onCancel={this.modalCancel}
        onOk={this.handleSubmit}
        // footer={[]}
        destroyOnClose
        width={this.pageWidth}
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
                    <Select
                      showSearch
                      value={companySeleteId}
                      placeholder="Select Company"
                      notFoundContent={getCompanyIng ? <Spin size="small" /> : null}
                      filterOption={false}
                      defaultActiveFirstOption={false}
                      onChange={value => this.searchOnChange(value, 'name_en')}
                      onSearch={this.onSeachrComppany}
                      style={{ width: 520, marginRight: 7 }}
                    >
                      {companyList.map(item => (
                        <Option key={item.id} value={item.id}>{item.name_en}</Option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="searchToolbar-btn">
                  <Button type="primary" disabled={!companySeleteId} onClick={() => this.addCompay()}>Add</Button>
                </div>
              </div>
              <div className="tablecontent">
                <div className="searchToolbar">
                  <div className="searchToolbar-btn">
                    {/* <Button type="primary" onClick={() => this.getAPIList()}>Delete</Button> */}
                  </div>
                </div>
                <div className="currenCompanyTable" style={{ marginBottom: '10px' }}>
                  <Table
                    columns={this.currentColumns}
                    dataSource={currentCompanyData}
                    pagination={false}
                  />
                </div>
                <Table
                  // showHeader={false}
                  loading={loading}
                  columns={this.columns}
                  // rowSelection={this.rowSelection}
                  dataSource={tableData}
                  pagination={false}
                />
              </div>
            </div>
          </Content>
        </Layout>
      </Modal>
    );
  }
}
CompanyRelatedSet.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};
export default CompanyRelatedSet;
