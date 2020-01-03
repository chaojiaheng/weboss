import React, { Component } from 'react';
// import { Layout, Breadcrumb } from 'antd';

import './home.css';


// const { Content } = Layout;
class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
    /*
    <Layout className="main" >
        <Breadcrumb style={{ margin: '12px 0' }}>
          <Breadcrumb.Item>首页</Breadcrumb.Item>
        </Breadcrumb>
        <Content style={{ background: '#fff', margin: '0 0 20px', height: '100%' }}>
          <Layout style={{ background: '#fff' }} className="index-content">

          </Layout>
        </Content>
      </Layout>
     */
    return (
      <div className="index-h2">
        <h1>Welcome to AILA Web OSS System！</h1>
      </div>
    );
  }
}

export default Index;
