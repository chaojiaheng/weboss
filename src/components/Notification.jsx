import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Notice from './Notice';

let noticeNumber = -1;
const getUuid = () => {
  noticeNumber += 1;
  return `notification-${Date.now()}-${noticeNumber}`;
};

class Notification extends Component {
  static propTypes = {
    prefixCls: PropTypes.string
  };

  static defaultProps = {
    prefixCls: 'zby-notification'
  };

  constructor(props) {
    super(props);
    this.state = {
      notices: [],
      // 是否显示蒙版
      hasMask: true,
    };
  }

  getNoticeDOM () {
    const { notices } = this.state;

    const result = notices.map(notice => {
      const closeCallback = () => {
        this.remove(notice.key);
        if (notice.onClose) {
          notice.onClose();
        }
      };

      return (
        <Notice
          key={notice.key}
          {...notice}
          onClose={closeCallback}
        />
      );
    });

    return result;
  }

  getMaskDOM () {
    const { notices, hasMask } = this.state;

    if (notices.length > 0 && hasMask === true) {
      return <div className="zby-mask" />;
    }
  }

  add(notice) {
    const { notices } = this.state;
    const key = notice.key ? notice.key : notice.key = getUuid();
    const mask = notice.mask ? notice.mask : false;
    const temp = notices.filter((item) => item.key === key).length;

    if (!temp) {
      notices.push(notice);
      this.setState({
        notices,
        hasMask: mask
      });
    }
  }

  remove(key) {
    this.setState(previousState => ({
      notices: previousState.notices.filter(notice => notice.key !== key)
    }));
  }

  render () {
    const { prefixCls } = this.props;
    const noticesDOM = this.getNoticeDOM();
    const maskDOM = this.getMaskDOM();

    return (
      <div className={prefixCls}>
        {maskDOM}
        {noticesDOM}
      </div>
    );
  }
}

Notification.reWrite = properties => {
  const { ...props } = properties || {};

  const div = document.createElement('div');
  document.body.appendChild(div);

  const notification = ReactDOM.render(<Notification {...props} />, div);

  return {
    notice(noticeProps) {
      notification.add(noticeProps);
    },
    removeNotice(key) {
      notification.remove(key);
    },
    destroy() {
      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);
    },
    component: notification
  };
};

export default Notification;
