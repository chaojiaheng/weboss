import React from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-dom';
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';
import { Provider } from 'react-redux';
// import { message } from 'antd';
import 'babel-polyfill';
import Store from './store';

import './common/common.css';
import Utils from './common/Utils';
import { ROUTE_NAMES } from './common/RouteNames';

import Login from './pages/login';
import Home from './pages/home';
import Index from './pages/index';
import CompanyList from './pages/companyManage/CompanyList';
import MembersManagement from './pages/companyManage/MembersManagement';
import MailList from './pages/mediaManage/MailList';
import SourcingRequestManagement from './pages/mediaManage/SourcingRequestManagement';
import PictureManagement from './pages/mediaManage/PictureManagement';
import VideoManagement from './pages/mediaManage/VideoManagement';
import NetMeeting from './pages/mediaManage/NetMeeting';
import AccountManagement from './pages/systemManage/AccountManagement';
import CustomerManagement from './pages/CRMManage/CustomerManagement';

const App = function(props) {
  return (
    <div className="app-container">
      {props.children}
    </div>
  );
};

App.propTypes = {
  children: PropTypes.element.isRequired,
};

// 渲染入口
const appDom = document.querySelector('#app');
const RN = ROUTE_NAMES;
const routeEnter = nextState => {
  Utils.fixTitle(nextState);
  // console.log(nextState.location.pathname);

  const neednotLoginPages = [
    ROUTE_NAMES.LOGIN,
  ];

  if (neednotLoginPages.indexOf(nextState.location.pathname) === -1) {
    const userInfo = JSON.parse(window.sessionStorage.getItem('AILA_userInfo'));
    if (!userInfo) {
      Utils.router.go(ROUTE_NAMES.LOGIN);
    }
  }
};

// const routeChange = (preState, nextState) => {
//   Utils.fixTitle(nextState);
// };


// 部分页面采用嵌套路由的方式进行跳转，可以保留上一级页面的状态，不用做滚动条的记录等功能
// 前提是下一个页面没有进入其他页面的路口，如果有的话，状态保留就会失败
// 带有子页面的需要使用onChange方法来监听，因为onEnter方法在从子页面返回父页面时不会触发

// 使用redux时的模板
render(
  (
    <Provider store={Store}>
      <Router history={hashHistory}>
        <Route path="/" component={App}>
          <IndexRedirect to={RN.HOME} />
          <Route path={RN.LOGIN} onEnter={routeEnter} component={Login} />
          <Route path={RN.HOME} onEnter={routeEnter} component={Home}>
            <IndexRedirect to={RN.INDEX} />
            <Route path={RN.INDEX} onEnter={routeEnter} component={Index} />
            <Route path={RN.COMPANYLIST} onEnter={routeEnter} component={CompanyList} />
            <Route path={RN.MembersManagement} onEnter={routeEnter} component={MembersManagement} />
            <Route path={RN.MAILLIST} onEnter={routeEnter} component={MailList} />
            <Route path={RN.SourcingRequestManagement} onEnter={routeEnter} component={SourcingRequestManagement} />
            <Route path={RN.PictureManagement} onEnter={routeEnter} component={PictureManagement} />
            <Route path={RN.VideoManagement} onEnter={routeEnter} component={VideoManagement} />
            <Route path={RN.NetMeeting} onEnter={routeEnter} component={NetMeeting} />
            <Route path={RN.AccountManagement} onEnter={routeEnter} component={AccountManagement} />
            <Route path={RN.CustomerManagement} onEnter={routeEnter} component={CustomerManagement} />
          </Route>
        </Route>
      </Router>
    </Provider>
  ),
  appDom,
);
