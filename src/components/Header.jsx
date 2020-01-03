import React, { Component } from 'react';
import './Header.css';

const toSearch = () => {
  location.hash = '/search';
};

const toScan = () => {
  console.log('调起扫码页面');
};

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popOver: false
    };
  }

  render() {
    return (
      <div className="header">
        <div className="header-logo"></div>
        <div className="header-search" onClick={toSearch}>搜索</div>
        <div className="header-scan" onClick={toScan}></div>
      </div>
    );
  }
}

export default Header;
