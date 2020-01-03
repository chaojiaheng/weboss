import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Layout, Table, Modal } from 'antd';
import Utils from '../../common/Utils';

import './companyManage.css';

const { Content } = Layout;


// 公司类型
const companyType = [
  { label: 'Head Office', value: 1 },
  { label: 'Branch Office', value: 2 },
];

class CompanyRelatedView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      loading: false,
      current: 1,
      pageSize: 10,
      tableTotal: '',
      tableData: [],
    };
    this.companyId = '';
    this.companyData = null;
    this.columns = [{
      title: 'No',
      dataIndex: 'key',
      key: 'key',
    }, {
      title: 'Company Name',
      dataIndex: 'name_en',
      key: 'name_en',
      width: '50%',
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
    }];

    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
    console.log(document.body.clientWidth);
    this.pageWidth = (document.body.clientWidth - 200) < 1280 ? 1280 : (document.body.clientWidth - 200);
    console.log(this.pageWidth);
    this.pageWidth = this.pageWidth > document.body.clientWidth ? (document.body.clientWidth - 40) : this.pageWidth;
    console.log(this.pageWidth);
  }
  componentDidMount() {
    this.props.onRef(this);
  }

  // 获取列表
  getAPIList = (page) => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_company/api/company/list`,
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


  render() {
    const { modalVisible, loading, current, pageSize, tableData, tableTotal } = this.state;
    return (
      <Modal
        title="Members Management"
        visible={modalVisible}
        onCancel={this.modalCancel}
        footer={[]}
        destroyOnClose
        width={this.pageWidth}
      >
        <Layout>
          <Content style={{ background: '#fff', margin: '0' }}>
            <div style={{ width: '100%', padding: '15px' }}>
              <div>
                <Table
                  loading={loading}
                  columns={this.columns}
                  dataSource={tableData}
                  pagination={{ current, pageSize, total: tableTotal, onChange: (this.pageOnChange) }}
                />
              </div>
            </div>
          </Content>
        </Layout>
      </Modal>
    );
  }
}
CompanyRelatedView.propsType = {
  onRef: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired,
};
export default CompanyRelatedView;
