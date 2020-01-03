import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LoginBase from '../components/LoginBase/LoginBase';
// import Images from '../images/index';
import './login.css';

export default class LoginPage extends Component {
  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        tenant: PropTypes.string,
      }).isRequired
    }).isRequired,
  };
  constructor(props) {
    super(props);
    this.state = {
      tenant: this.props.location.query.tenant
    };

    // console.log(this.props.location);
  }

  render() {
    // style={{ backgroundImage: `url(${Images.loginBg})`, backgroundSize: 'contain' }}
    const { tenant } = this.state;
    return (
      <div className="login-wrapper" >
        <div className="login-logo">
        </div>
        <LoginBase tenant={tenant} />
      </div>
    );
  }
}
