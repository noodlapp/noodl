import React from 'react';

import Layout from '../../../layout';
import PointerListeners from '../../../pointerlisteners';
import { Noodl } from '../../../types';

export interface VideoProps extends Noodl.ReactProps {
  objectPositionX: string;
  objectPositionY: string;

  dom: Exclude<CachedVideoProps, 'innerRef' | 'onCanPlay'>;

  onCanPlay?: () => void;
  videoWidth?: (value: number) => void;
  videoHeight?: (value: number) => void;
  onVideoElementCreated?: (video) => void;
}

export interface CachedVideoProps {
  className?: string;
  style?: React.CSSProperties;

  muted?: boolean;
  loop?: boolean;
  volume?: number;
  autoplay?: boolean;
  controls?: boolean;
  src: string;

  innerRef: (video: HTMLVideoElement) => void;
  onCanPlay: () => void;
}

class CachedVideo extends React.PureComponent<CachedVideoProps> {
  video: HTMLVideoElement;

  componentDidUpdate() {
    if (this.video) {
      this.video.muted = this.props.muted;
      this.video.loop = this.props.loop;
      this.video.volume = this.props.volume;
      this.video.autoplay = this.props.autoplay;
      this.video.controls = this.props.controls;
    }
  }

  render() {
    let src = this.props.src ? this.props.src.toString() : undefined;

    if (src) {
      if (src.indexOf('#t=') === -1) {
        src += '#t=0.01'; //force Android to render the first frame
      }
      if (src.startsWith('/')) {
        // @ts-expect-error missing Noodl typings
        const baseUrl = Noodl.Env['BaseUrl'];
        if (baseUrl) {
          src = baseUrl + src.substring(1);
        }
      }
    }

    return (
      <video
        {...this.props}
        playsInline={true}
        src={src}
        {...PointerListeners(this.props)}
        ref={(video) => {
          this.video = video;
          this.props.innerRef(video);
        }}
      />
    );
  }
}

export class Video extends React.Component<VideoProps> {
  wantToPlay: boolean;
  canPlay: boolean;
  video: HTMLVideoElement;

  constructor(props: VideoProps) {
    super(props);

    this.wantToPlay = false;
    this.canPlay = false;
  }

  componentWillUnmount() {
    this.canPlay = false;
  }

  setSourceObject(src) {
    if (this.video.srcObject !== src) {
      this.video.srcObject = src;
      this.canPlay = false; //wait for can play event
    }
  }

  play() {
    this.wantToPlay = true;
    if (this.canPlay) {
      this.video.play();
    }
  }

  restart() {
    this.wantToPlay = true;
    if (this.canPlay) {
      this.video.currentTime = 0;
      this.video.play();
    }
  }

  pause() {
    this.wantToPlay = false;
    this.video && this.video.pause();
  }

  reset() {
    this.wantToPlay = false;
    if (this.video) {
      this.video.currentTime = 0;
      this.video.pause();
    }
  }

  render() {
    const props = this.props;
    const style = {
      ...props.style
    };

    Layout.size(style, props);
    Layout.align(style, props);

    if (style.opacity === 0) {
      style.pointerEvents = 'none';
    }

    style.objectPosition = `${props.objectPositionX} ${props.objectPositionY}`;

    return (
      <CachedVideo
        {...props.dom}
        className={props.className}
        style={style}
        innerRef={(video) => {
          this.video = video;
          this.props.onVideoElementCreated && this.props.onVideoElementCreated(video);
        }}
        onCanPlay={() => {
          this.canPlay = true;
          if (this.wantToPlay) {
            this.video.play();
          }
          this.props.onCanPlay && this.props.onCanPlay();
          this.props.videoWidth && this.props.videoWidth(this.video.videoWidth);
          this.props.videoHeight && this.props.videoHeight(this.video.videoHeight);
        }}
      />
    );
  }
}
