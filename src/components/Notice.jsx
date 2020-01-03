import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './notice.css';

const emptyFunc = () => {};
const ANIMATION_END_TIME = 300;

class Notice extends Component {
  static propTypes = {
    duration: PropTypes.number.isRequired,
    prefixCls: PropTypes.string,
    type: PropTypes.oneOf(['info', 'success', 'error']),
    iconClass: PropTypes.string,
    content: PropTypes.string,
    onClose: PropTypes.func
  };

  static defaultProps = {
    duration: 5000,
    prefixCls: 'notice',
    type: 'info',
    iconClass: '',
    content: '',
    onClose: emptyFunc
  };

  constructor(props) {
    super(props);
    this.state = {
      shouldShow: false,
      shouldClose: false
    };
  }

  componentDidMount() {
    // 显示时采用异步的方式去修改state，为了让淡入淡出的动画生效
    setTimeout(() => {
      this.setState({ shouldShow: true });
    }, 0);

    // 关闭计时
    if (this.props.duration > 0) {
      // 减掉动画消失时间
      this.closeTimer = setTimeout(() => {
        this.close();
      }, this.props.duration - ANIMATION_END_TIME);
    }
  }

  componentWillUnmount() {
    // 当有意外关闭的时候 清掉定时器
    this.clearCloseTimer();
  }

  clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  close() {
    // 关闭的时候 应该先清掉倒数定时器
    // 然后开启过场动画
    // 等待动画结束，执行回调
    this.clearCloseTimer();
    this.setState({
      shouldClose: true
    });
    this.timer = setTimeout(() => {
      if (this.props.onClose) {
        this.props.onClose();
      }
      clearTimeout(this.timer);
    }, ANIMATION_END_TIME);
  }

  render() {
    const { shouldShow, shouldClose } = this.state;
    const { prefixCls, type, iconClass, content } = this.props;

    return (
      <div
        className={classNames([prefixCls,
          {
            info: type === 'info',
            success: type === 'success',
            error: type === 'error',
            active: shouldShow,
            leave: shouldClose
          }
        ])}
      >
        {
          iconClass
            ? <div className={`${prefixCls}-icon`}><div className={iconClass}></div></div>
            : null
        }
        <div className={`${prefixCls}-content`}>{content}</div>
      </div>
    );
  }
}

export default Notice;
