import BScroll from '@better-scroll/core';
import MouseWheel from '@better-scroll/mouse-wheel';
import ScrollBar from '@better-scroll/scroll-bar';
import React from 'react';
import ReactDOM from 'react-dom';

import Layout from '../../../layout';
import PointerListeners from '../../../pointerlisteners';
import { Noodl } from '../../../types';
import NestedScroll from './scroll-plugins/nested-scroll-plugin';
import patchedMomentum from './scroll-plugins/patched-momentum-scroll';
import Slide from './scroll-plugins/slide-scroll-plugin';

BScroll.use(ScrollBar);
BScroll.use(NestedScroll);
BScroll.use(MouseWheel);
BScroll.use(Slide);

export interface GroupProps extends Noodl.ReactProps {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<unknown>;

  attrs: React.Attributes;

  scrollSnapEnabled: boolean;
  showScrollbar: boolean;
  scrollEnabled: boolean;
  nativeScroll: boolean;
  scrollSnapToEveryItem: boolean;
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  scrollBounceEnabled: boolean;
  clip: boolean;

  layout: 'none' | 'row' | 'column';
  dom;

  onScrollPositionChanged?: (value: number) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

type ScrollRef = HTMLDivElement & { noodlNode?: Noodl.ReactProps['noodlNode'] };

export class Group extends React.Component<GroupProps> {
  scrollNeedsToInit: boolean;
  scrollRef: React.RefObject<ScrollRef>;
  iScroll?: BScroll;

  constructor(props: GroupProps) {
    super(props);
    this.scrollNeedsToInit = false;
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.scrollEnabled && this.props.nativeScroll !== true) {
      this.setupIScroll();
    }

    //plumbing for the focused signals
    this.scrollRef.current.noodlNode = this.props.noodlNode;
  }

  componentWillUnmount() {
    if (this.iScroll) {
      this.iScroll.destroy();
      this.iScroll = undefined;
    }

    this.props.noodlNode.context.setNodeFocused(this.props.noodlNode, false);
  }

  componentDidUpdate() {
    if (this.scrollNeedsToInit) {
      this.setupIScroll();
      this.scrollNeedsToInit = false;
    }

    if (this.iScroll) {
      setTimeout(() => {
        this.iScroll && this.iScroll.refresh();
      }, 0);
    }
  }

  scrollToIndex(index, duration) {
    if (this.iScroll) {
      const child = this.scrollRef.current.children[0].children[index] as HTMLElement;
      if (child) {
        this.iScroll.scrollToElement(child, duration, 0, 0);
      }
    } else {
      const child = this.scrollRef.current.children[index];
      child &&
        child.scrollIntoView({
          behavior: 'smooth'
        });
    }
  }

  scrollToElement(noodlChild, duration) {
    if (!noodlChild) return;
    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(noodlChild.getRef()) as HTMLElement;
    if (element && element.scrollIntoView) {
      if (this.iScroll) {
        this.iScroll.scrollToElement(element, duration, 0, 0);
      } else {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  }

  setupIScroll() {
    const { scrollSnapEnabled } = this.props;
    const scrollDirection = this.getScrollDirection();

    const snapOptions = {
      disableSetWidth: true,
      disableSetHeight: true,
      loop: false
    };

    const domElement = this.scrollRef.current;
    this.iScroll = new BScroll(domElement, {
      bounceTime: 500,
      swipeBounceTime: 300,
      scrollbar: this.props.showScrollbar ? {} : undefined,
      momentum: scrollSnapEnabled ? !this.props.scrollSnapToEveryItem : true,
      bounce: this.props.scrollBounceEnabled && !(scrollSnapEnabled && snapOptions.loop),
      scrollX: scrollDirection === 'x' || scrollDirection === 'both',
      scrollY: scrollDirection === 'y' || scrollDirection === 'both',
      slide: scrollSnapEnabled ? snapOptions : undefined,
      probeType: this.props.onScrollPositionChanged ? 3 : 1,
      click: true,
      nestedScroll: true,
      //disable CSS animation, they can cause a flicker on iOS,
      //and cause problems with probing the scroll position during an animation
      useTransition: false
    });

    //the scroll behavior when doing a momentum scroll that reaches outside the bounds
    //does a slow and unpleasant animation. Let's patch it to make it behave more like iScroll.
    const scroller = this.iScroll.scroller;
    // @ts-expect-error momentum does exist
    scroller.scrollBehaviorX && (scroller.scrollBehaviorX.momentum = patchedMomentum.bind(scroller.scrollBehaviorX));
    // @ts-expect-error momentum does exist
    scroller.scrollBehaviorY && (scroller.scrollBehaviorY.momentum = patchedMomentum.bind(scroller.scrollBehaviorY));

    //refresh the scroll view in case a child has changed height, e.g. an image loaded
    //seem to be very performant, no observed problem so far
    this.iScroll.on('beforeScrollStart', () => {
      this.iScroll.refresh();
    });

    this.iScroll.on('scrollStart', () => {
      this.props.onScrollStart && this.props.onScrollStart();
    });

    this.iScroll.on('scrollEnd', () => {
      this.props.onScrollEnd && this.props.onScrollEnd();
    });

    if (this.props.onScrollPositionChanged) {
      this.iScroll.on('scroll', () => {
        this.props.onScrollPositionChanged(scrollDirection === 'x' ? -this.iScroll.x : -this.iScroll.y);
      });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: GroupProps) {
    const scrollHasUpdated =
      this.props.scrollSnapEnabled !== nextProps.scrollSnapEnabled ||
      this.props.onScrollPositionChanged !== nextProps.onScrollPositionChanged ||
      this.props.onScrollStart !== nextProps.onScrollStart ||
      this.props.onScrollEnd !== nextProps.onScrollEnd ||
      this.props.showScrollbar !== nextProps.showScrollbar ||
      this.props.scrollEnabled !== nextProps.scrollEnabled ||
      this.props.nativeScroll !== nextProps.nativeScroll ||
      this.props.scrollSnapToEveryItem !== nextProps.scrollSnapToEveryItem ||
      this.props.layout !== nextProps.layout ||
      this.props.flexWrap !== nextProps.flexWrap ||
      this.props.scrollBounceEnabled !== nextProps.scrollBounceEnabled;

    if (scrollHasUpdated) {
      if (this.iScroll) {
        this.iScroll.destroy();
        this.iScroll = undefined;
      }

      this.scrollNeedsToInit = nextProps.scrollEnabled && !nextProps.nativeScroll;
    }
  }

  renderIScroll() {
    const { flexDirection, flexWrap } = this.props.style;

    const childStyle: React.CSSProperties = {
      display: 'inline-flex',
      flexShrink: 0,
      flexDirection,
      flexWrap,
      touchAction: 'none'
      // pointerEvents: this.state.isScrolling ? 'none' : undefined
    };

    if (flexDirection === 'row') {
      if (flexWrap === 'wrap') {
        childStyle.width = '100%';
      } else {
        childStyle.height = '100%';
      }
    } else {
      if (flexWrap === 'wrap') {
        childStyle.height = '100%';
      } else {
        childStyle.width = '100%';
      }
    }

    return (
      <div className="scroll-wrapper-internal" style={childStyle}>
        {this.props.children}
      </div>
    );
  }

  getScrollDirection(): 'x' | 'y' | 'both' {
    // TODO: This never returns both, why?

    if (this.props.flexWrap === 'wrap' || this.props.flexWrap === 'wrap-reverse') {
      return this.props.layout === 'row' ? 'y' : 'x';
    }

    return this.props.layout === 'row' ? 'x' : 'y';
  }

  render() {
    const {
      as: Component = 'div',
      ...props
    } = this.props;

    const children = props.scrollEnabled && !props.nativeScroll ? this.renderIScroll() : props.children;
    
    const style = { ...props.style };
    Layout.size(style, props);
    Layout.align(style, props);

    if (props.clip) {
      style.overflowX = 'hidden';
      style.overflowY = 'hidden';
    }

    if (props.scrollEnabled && props.nativeScroll) {
      const scrollDirection = this.getScrollDirection();
      if (scrollDirection === 'y') {
        style.overflowY = 'auto';
      } else if (scrollDirection === 'x') {
        style.overflowX = 'auto';
      } else if (scrollDirection === 'both') {
        style.overflowX = 'auto';
        style.overflowY = 'auto';
      }
    }

    if (style.opacity === 0) {
      style.pointerEvents = 'none';
    }

    return (
      <Component
        // @ts-expect-error Lets hope that the type passed here is always static!
        className={props.className}
        {...props.attrs}
        {...props.dom}
        {...PointerListeners(props)}
        style={style}
        ref={this.scrollRef}
      >
        {children}
      </Component>
    );
  }
}
