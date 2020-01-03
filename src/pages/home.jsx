import React, { Component } from 'react';
import { Link } from 'react-router';
import { Layout, Menu, Icon, Button, Dropdown, Modal, Input, message, Tooltip } from 'antd';
import { ROUTE_NAMES } from '../common/RouteNames';
// import { ROLE_PERMISSIONS_VALUE } from '../common/Constant';
import Utils from '../common/Utils';
import './home.css';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

class NavPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalEditPasswordVisible: false,
      confirmLoading: false,
      canChangePassword: false,
      hasInputEnterPassword: false,
      collapsed: false,
      openKeys: this.arr(),
      isSelect: window.location.hash.substr(1),
    };

    this.formData = {
      oldPassword: '',
      newPassword: '',
    };


    this.AILA_userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
  }

  componentWillMount() {
    window.addEventListener('popstate', this.handlePop.bind(this));
  }

  componentDidMount() {
    window.removeEventListener('popstate', this.handlePop.bind(this));
  }

  onOpenChange = (openKeys) => {
    const state = this.state;
    const latestOpenKey = openKeys.find(key => !(state.openKeys.indexOf(key) > -1));
    const latestCloseKey = state.openKeys.find(key => !(openKeys.indexOf(key) > -1));

    let nextOpenKeys = [];
    if (latestOpenKey) {
      nextOpenKeys = this.getAncestorKeys(latestOpenKey).concat(latestOpenKey);
    }
    if (latestCloseKey) {
      nextOpenKeys = this.getAncestorKeys(latestCloseKey);
    }
    this.setState({ openKeys: nextOpenKeys });
  };

  onClickLogout = () => {
    console.log('退出');
    this.logout();
  };

  getAncestorKeys = (key) => {
    // console.log(key);
    const map = {
      sub4: ['sub3'],
    };
    return map[key] || [];
  };

  modalInputOnchange = (e, type) => {
    let checkTmp = false;
    switch (type) {
      case 'oldPassword':
        this.formData.oldPassword = e.target.value;
        break;
      case 'newPassword':
        this.formData.newPassword = e.target.value;
        break;
      case 'enterNewPassword':
        if (this.formData.newPassword === e.target.value) {
          checkTmp = true;
        }
        if (!this.state.hasInputEnterPassword) {
          this.setState({
            hasInputEnterPassword: true,
            canChangePassword: checkTmp,
          });
        } else {
          this.setState({
            canChangePassword: checkTmp,
          });
        }
        break;
      default:
        break;
    }
  };
  modalEditOk = () => {
    this.setState({
      confirmLoading: true,
    });
    // 修改密码
    Utils.request({
      url: `${window.PAY_API_HOST}/baseapi/admin_user/api/password/reset`,
      method: 'post',
      data: {
        // oldPassword: this.formData.oldPassword,
        user_id: this.AILA_userInfo.id,
        password: this.formData.newPassword,
      }
    })
      .then(res => {
        if (res && res.success) {
          this.setState({
            modalEditPasswordVisible: false,
            confirmLoading: false,
          });
          message.success('Password modification was successful!');
          // this.logout();
        }
      })
      .catch(() => {
        message.error('Password modification failed!');
      });
  };

  modalEditCancel = () => {
    this.setState({ modalEditPasswordVisible: false });
  };

  toggle = () => {
    console.log(this.state.collapsed);
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  arr = () => {
    const arr = window.location.hash.substr(1).split('/');
    arr.splice(0, 1);
    arr.splice(-1, 1);
    return arr;
  }

  handlePop() {
    this.setState({
      isSelect: window.location.hash.substr(1),
      openKeys: this.arr(),
    });
  }

  handleClick = (e) => {
    // console.log('Clicked: ', e);
    this.setState({
      current: e.key,
    });
  };
  // 退出接口 Liser
  logout = () => {
    this.setState({ loading: true });
    Utils.request({
      url: `${window.PAY_API_HOST}/op/system/user/logout`,
      method: 'GET',
      data: {},
      type: 'json',
    }).then((res) => {
      console.log(res);
      if (res.success) {
        window.sessionStorage.clear();
        if (window.loginUrlPram) {
          Utils.router.go(`${ROUTE_NAMES.LOGIN}?tenant=${window.loginUrlPram}`);
        } else {
          Utils.router.go(`${ROUTE_NAMES.LOGIN}`);
        }
      }
    });
  };

  render() {
    // let privileges = ['2', '1', 'dataMenu', 'dataMenu100', 'dataMenu200', 'dataMenu300', 'mediaMenu', 'mediaMenu100', 'mediaMenu200', 'userMenu', 'userMenu100', 'userMenu200', 'userMenu300'];
    const { confirmLoading, modalEditPasswordVisible, canChangePassword, hasInputEnterPassword } = this.state;
    const userInfo = window.sessionStorage.getItem('AILA_userInfo') ? JSON.parse(window.sessionStorage.getItem('AILA_userInfo')) : null;
    let userName = '企业';
    if (userInfo && userInfo.username) {
      userName = userInfo.username;
    }

    const menuNowUser = (
      <Menu>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" onClick={() => { this.setState({ modalEditPasswordVisible: true }); }}>Change Password</a>
        </Menu.Item>
        {/*
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" onClick={this.onClickLogout}>Safe Exit</a>
        </Menu.Item>
        */}
      </Menu>
    );
    let modalTootip = null;
    // let okDisibale = true;
    if (hasInputEnterPassword && !canChangePassword) {
      modalTootip = (
        <div className="ico redTip">
          <Tooltip title="请确认新密码是否一致!">
            <Icon type="exclamation-circle-o" />
          </Tooltip>
        </div>
        );
    } else if (hasInputEnterPassword && canChangePassword) {
      // okDisibale = false;
      modalTootip = (
        <div className="ico greenTip">
          <Icon type="check-circle-o" />
        </div>
      );
    }

    return (
      <Layout>
        <Sider
          trigger={null}
          collapsible
          width={300}
          collapsed={this.state.collapsed}
        >
          <div className="logo" />
          <div className="Slider-menu">
            <Menu
              theme="dark"
              mode="inline"
              onOpenChange={this.onOpenChange}
              // openKeys={this.state.openKeys}
              selectedKeys={[`${this.state.isSelect}`]}
              onClick={this.handleClick}
            >

              <Menu.Item key="/index" ><Link to="/index"> <Icon type="home" /><span>Home</span></Link></Menu.Item>
              <SubMenu key="systemManage" title={<span><Icon type="setting" /><span>System Management</span></span>}>
                <Menu.Item key="/systemManage/AccountManagement"><Link to="/systemManage/AccountManagement">Account Management</Link></Menu.Item>
              </SubMenu>
              <SubMenu key="CRMManage" title={<span><Icon type="team" /><span>CRM</span></span>}>
                <Menu.Item key="/CRMManage/CustomerManagement"><Link to="/CRMManage/CustomerManagement">Customer Management</Link></Menu.Item>
              </SubMenu>
              <SubMenu key="companyMange" title={<span><Icon type="appstore" /><span>Company Management</span></span>}>
                {/* <Menu.Item key="/companyMange/MembersManagement"><Link to="/companyMange/MembersManagement">Members Management</Link></Menu.Item> */}
                <Menu.Item key="/companyMange/companyList"><Link to="/companyMange/companyList">Company Information Management</Link></Menu.Item>
              </SubMenu>
              <SubMenu key="mediaManage" title={<span><Icon type="video-camera" /><span>The management of media assets</span></span>}>
                <Menu.Item key="/mediaManage/mailList"><Link to="/mediaManage/mailList">Message Mangement</Link></Menu.Item>
                <Menu.Item key="/mediaManage/SourcingRequestManagement"><Link to="/mediaManage/SourcingRequestManagement">Sourcing Request Management</Link></Menu.Item>
                <Menu.Item key="/mediaManage/PictureManagement"><Link to="/mediaManage/PictureManagement">Picture Management</Link></Menu.Item>
                <Menu.Item key="/mediaManage/VideoManagement"><Link to="/mediaManage/VideoManagement">Video Management</Link></Menu.Item>
                <Menu.Item key="/mediaManage/NetMeeting"><Link to="/mediaManage/NetMeeting">One to One Video</Link></Menu.Item>
              </SubMenu>
              {/*
                privileges.indexOf(ROLE_PERMISSIONS_VALUE.SceneManage.main) > -1 &&
                <SubMenu key="sceneManage" title={<span><Icon type="edit" /><span>场景管理</span></span>}>
                  {
                    privileges.indexOf(ROLE_PERMISSIONS_VALUE.SceneManage.sub[0]) > -1 &&
                    <Menu.Item key="/sceneManage/sceneManage"><Link to="/sceneManage/sceneManage">商户场景列表</Link></Menu.Item>
                  }
                  {
                    privileges.indexOf(ROLE_PERMISSIONS_VALUE.SceneManage.sub[1]) > -1 &&
                    <Menu.Item key="/sceneManage/nowReleaseVersion"><Link to="/sceneManage/nowReleaseVersion">当前发布场景列表</Link></Menu.Item>
                  }
                </SubMenu>
              */}
            </Menu>
          </div>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: 0 }}>
            <Icon
              className="trigger"
              type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
            <Dropdown overlay={menuNowUser}>
              <a className="ant-dropdown-link set-menu">
                <Button icon="user" style={{ border: 0 }} >{ userName && userName }</Button><Icon type="down" />
              </a>
            </Dropdown>
            { /* <Button className="logout" onClick={this.onClickLogout} icon="logout" ></Button> */ }
          </Header>
          <Content style={{ padding: '0 24px' }}>
            { this.props.children }
          </Content>
          <Modal
            title="Change Password"
            destroyOnClose
            visible={modalEditPasswordVisible}
            onCancel={this.modalEditCancel}
            footer={[
              <Button key="back" onClick={this.modalEditCancel}>取消</Button>,
              <Button key="submit" type="primary" disabled={!canChangePassword} loading={confirmLoading} onClick={this.modalEditOk}>
                确认
              </Button>,
            ]}
            width="560px"
          >
            <div className="userformBox">
              {/*
              <div className="formSection flex">
                <p className="label">Old password：</p>
                <div className="con">
                  <Input type="password" placeholder="请输入原密码" onChange={e => this.modalInputOnchange(e, 'oldPassword')} />
                </div>
              </div>
              */}
              <div className="formSection flex">
                <p className="label">New password：</p>
                <div className="con">
                  <Input type="password" placeholder="请输入新密码" onChange={e => this.modalInputOnchange(e, 'newPassword')} />
                </div>
                { modalTootip && modalTootip }
              </div>
              <div className="formSection flex">
                <p className="label">Confirm password：</p>
                <div className="con">
                  <Input type="password" placeholder="确认新密码" onChange={e => this.modalInputOnchange(e, 'enterNewPassword')} />
                </div>
                { modalTootip && modalTootip }
              </div>
            </div>
          </Modal>
        </Layout>
      </Layout>
    );
  }
}

export default NavPage;
