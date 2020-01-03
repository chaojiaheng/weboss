import React from 'react';
import classNames from 'classnames';

import './FootTabs.css';

const FootTabs = () => {
  const tabs = [{
    name: '首页',
    icon: 'home',
    url: '/home'
  }, {
    name: '分类',
    icon: 'category',
    url: '/category'
  }, {
    name: '购物车',
    icon: 'cart',
    url: '/cart'
  }, {
    name: '我的',
    icon: 'mine',
    url: '/mine'
  }];

  const goToTarget = url => {
    const newUrl = `#${url}`;
    // TODO, 如果是我的、购物车页面的话，需要先判断是否已经登录，未登录直接展示登录页面，登录后再跳回
    if (location.hash !== newUrl) {
      location.replace(newUrl);
    }
  };

  const getTabsDom = () => tabs.map(tab => {
    const isActive = `#${tab.url}` === location.hash;
    return (
      <div
        className="foot-tab"
        key={`foot_tab_${tab.name}`}
        onClick={() => goToTarget(tab.url)}
      >
        <div className={classNames('foot-tab-icon', tab.icon, { active: isActive })}></div>
        <p className={classNames('foot-tab-text', { active: isActive })}>{tab.name}</p>
      </div>
    );
  });

  return (
    <div className="foot-tabs">
      {getTabsDom()}
    </div>
  );
};

export default FootTabs;
