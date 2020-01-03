import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Carousel from 'rmc-nuka-carousel';
import './Swiper.css';

const emptyFunc = () => {};

const Decorator = props => {
  const getDotDom = () => {
    const doms = [];
    for (let i = 0; i < props.slideCount; i += 1) {
      doms[i] = (
        <div
          key={`swiper-dot-${i}`}
          className={classnames('swiper-dot', { active: i === props.currentSlide })}
        ></div>
      );
    }
    return doms;
  };

  return (
    <div className="swiper-dot-container">
      {getDotDom()}
    </div>
  );
};

Decorator.propTypes = {
  slideCount: PropTypes.number.isRequired,
  currentSlide: PropTypes.number.isRequired
};

const Swiper = props => {
  const decorators = props.dots ? [{ component: Decorator, position: 'BottomCenter' }] : [];

  return (
    <Carousel
      slideIndex={props.slideIndex}
      autoplay={props.autoplay}
      autoplayInterval={props.autoplayInterval}
      wrapAround={props.infinite}
      decorators={decorators}
      beforeSlide={props.beforeSlide}
      afterSlide={props.afterSlide}
    >
      {props.children}
    </Carousel>
  );
};

Swiper.propTypes = {
  slideIndex: PropTypes.number,
  // 是否自动切换
  autoplay: PropTypes.bool,
  // 自动切换的话，切换的时间
  autoplayInterval: PropTypes.number,
  // 是否循环播放
  infinite: PropTypes.bool,
  // 是否显示面板指示点
  dots: PropTypes.bool,
  // 切换面板前的回调函数
  beforeSlide: PropTypes.func,
  // 切换面板后的回调函数
  afterSlide: PropTypes.func,
  children: PropTypes.array || PropTypes.object
};

Swiper.defaultProps = {
  slideIndex: 0,
  autoplay: false,
  autoplayInterval: 5000,
  infinite: false,
  dots: false,
  beforeSlide: emptyFunc,
  afterSlide: emptyFunc,
  children: null
};

export default Swiper;
