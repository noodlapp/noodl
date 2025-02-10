import classNames from 'classnames';
import React from 'react';

import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Logo.module.scss';

export enum LogoVariant {
  Default = 'default',
  Inverted = 'inverted',
  Grayscale = 'grayscale'
}

export enum LogoSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large'
}

export interface LogoProps extends UnsafeStyleProps {
  variant?: LogoVariant;
  size?: LogoSize;

  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Logo({
  variant = LogoVariant.Default,
  size = LogoSize.Medium,
  onClick,
  UNSAFE_className,
  UNSAFE_style
}: LogoProps) {
  function VariantIcon(props: {}) {
    switch (variant) {
      default:
      case LogoVariant.Default:
        return <DefaultIcon />;
      case LogoVariant.Inverted:
        return <InvertedIcon />;
      case LogoVariant.Grayscale:
        return <GrayscaleIcon />;
    }
  }

  return (
    <div
      className={classNames([css['Root'], css[`is-variant-${variant}`], css[`is-size-${size}`], UNSAFE_className])}
      onClick={onClick}
      style={UNSAFE_style}
    >
      <VariantIcon />
    </div>
  );
}

const DefaultIcon = React.memo(function () {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_i_574_6111)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.76172 24.8943L3.76172 25.7516C3.99042 39.1618 14.9298 49.9629 28.3932 49.9685H28.4072L28.4072 14.8675L48.1979 14.8675C52.1163 14.8675 55.2928 11.691 55.2928 7.77258C55.2928 3.85417 52.1163 0.677665 48.1979 0.677666L28.4072 0.677669V0.67749L28.4036 0.67749C14.9354 0.677491 3.99048 11.4808 3.76172 24.8943ZM31.3869 14.8676H28.4105V17.7311C28.481 16.1441 29.7849 14.8778 31.3869 14.8676ZM26.5352 35.4054C26.5352 36.4366 27.3711 37.2725 28.4022 37.2725V33.5383C27.3711 33.5383 26.5352 34.3743 26.5352 35.4054Z"
          fill="url(#paint0_linear_574_6111)"
        />
      </g>
      <g filter="url(#filter1_i_574_6111)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.4805 35.166L13.4805 34.8968C13.5528 26.7095 20.2122 20.0947 28.4165 20.0947L28.4171 20.0947L28.4171 37.2721H28.4176C34.571 37.2721 39.5657 42.2334 39.6196 48.3741V48.5751C39.5657 54.7136 34.5746 59.6736 28.4242 59.6771H28.4177V59.6772H25.4304C23.7805 59.6772 22.443 58.3397 22.443 56.6898C22.443 55.04 23.7805 53.7025 25.4304 53.7025H28.4051V53.7026C29.4363 53.7026 30.2722 52.8667 30.2722 51.8355C30.2722 50.8084 29.4428 49.975 28.4171 49.9685V49.9681H28.4102C20.2088 49.9647 13.5527 43.3512 13.4805 35.166ZM28.4177 20.0948L36.6329 20.0948C40.345 20.0948 43.3544 23.1042 43.3544 26.8163C43.3544 30.5285 40.3451 33.5378 36.6329 33.5378L28.4177 33.5378L28.4177 20.0948ZM28.4049 37.2724C27.3737 37.2724 26.5378 36.4365 26.5378 35.4053C26.5378 34.3741 27.3737 33.5382 28.4049 33.5382V37.2724Z"
          fill="url(#paint1_radial_574_6111)"
        />
      </g>
      <defs>
        <filter
          id="filter0_i_574_6111"
          x="3.76172"
          y="0.67749"
          width="51.5312"
          height="53.291"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="8" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_574_6111" />
        </filter>
        <filter
          id="filter1_i_574_6111"
          x="13.4805"
          y="20.0947"
          width="29.875"
          height="43.5825"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="12" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_574_6111" />
        </filter>
        <linearGradient
          id="paint0_linear_574_6111"
          x1="28.407"
          y1="25.323"
          x2="3.76172"
          y2="25.323"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF1818" />
          <stop offset="0.835" stopColor="#FFC700" />
        </linearGradient>
        <radialGradient
          id="paint1_radial_574_6111"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(43.5954 26.9914) rotate(125.992) scale(39.6798 39.1304)"
        >
          <stop stopColor="#FF0000" />
          <stop offset="1" stopColor="#6732FF" />
        </radialGradient>
      </defs>
    </svg>
  );
});

const InvertedIcon = React.memo(function () {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 13.3981C0 5.99852 5.99852 0 13.3981 0H46.6019C54.0015 0 60 5.99852 60 13.3981V46.6019C60 54.0015 54.0015 60 46.6019 60H13.3981C5.99852 60 0 54.0015 0 46.6019V13.3981Z"
        fill="url(#paint0_linear_569_5866)"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M29.5856 25.4583L36.212 25.4583C38.5885 25.4583 40.515 27.3848 40.515 29.7613C40.515 32.1378 38.5885 34.0643 36.212 34.0643L29.5856 34.0643C28.1361 34.0643 26.9611 35.2394 26.9611 36.6889C26.9611 38.1383 28.1362 39.3134 29.5856 39.3134C33.9555 39.3134 37.4985 42.8535 37.5031 47.2222V47.2393C37.4985 51.608 33.9555 55.1482 29.5856 55.1482H27.1761C26.463 55.1482 25.885 54.5701 25.885 53.8571C25.885 53.1441 26.463 52.566 27.1761 52.566H29.5856C31.0351 52.566 32.2102 51.3911 32.2102 49.9416C32.2102 48.4921 31.0351 47.317 29.5856 47.317C23.5529 47.317 18.6617 42.4292 18.6562 36.3978V36.3775C18.6617 30.3461 23.5529 25.4583 29.5856 25.4583Z"
        fill="black"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M29.5868 8.67749L45.5503 8.67749C48.7109 8.67749 51.2731 11.2397 51.2731 14.4002C51.2731 17.5608 48.7109 20.123 45.5503 20.123L31.9874 20.123C30.6594 20.1323 29.5857 21.2117 29.5857 22.5419V22.5419H29.5856V23.2213C22.3185 23.222 16.4268 29.1103 16.4206 36.3762V36.3993C16.4241 40.5418 18.3408 44.2365 21.3346 46.6476C14.4743 43.5135 9.70703 36.5918 9.70703 28.5567C9.70703 17.5779 18.6069 8.67784 29.5856 8.6776L29.5856 20.123H29.5868L29.5868 8.67749ZM29.5856 39.3135V47.3171C23.5535 47.3164 18.6631 42.4289 18.6576 36.3978V36.3776C18.6631 30.3466 23.5535 25.4591 29.5856 25.4583V34.0644C28.1368 34.0652 26.9625 35.2399 26.9625 36.6889C26.9625 38.138 28.1368 39.3127 29.5856 39.3135ZM29.5856 37.0764V36.3015C29.5852 36.3015 29.5847 36.3015 29.5842 36.3015V37.0764C29.5847 37.0764 29.5852 37.0764 29.5856 37.0764Z"
        fill="black"
      />
      <defs>
        <linearGradient
          id="paint0_linear_569_5866"
          x1="9.6215e-06"
          y1="-4.68362e-06"
          x2="60"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#EFBB07" />
          <stop offset="0.0001" stop-color="#682BD8" />
          <stop offset="0.505" stop-color="#FF0000" />
          <stop offset="0.88" stop-color="#EFBB07" />
        </linearGradient>
      </defs>
    </svg>
  );
});

const GrayscaleIcon = React.memo(function () {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M29.5856 25.4583L36.212 25.4583C38.5885 25.4583 40.515 27.3848 40.515 29.7613C40.515 32.1378 38.5885 34.0643 36.212 34.0643L29.5856 34.0643C28.1361 34.0643 26.9611 35.2394 26.9611 36.6889C26.9611 38.1383 28.1362 39.3134 29.5856 39.3134C33.9555 39.3134 37.4985 42.8535 37.5031 47.2222V47.2393C37.4985 51.608 33.9555 55.1482 29.5856 55.1482H27.1761C26.463 55.1482 25.885 54.5701 25.885 53.8571C25.885 53.1441 26.463 52.566 27.1761 52.566H29.5856C31.0351 52.566 32.2102 51.3911 32.2102 49.9416C32.2102 48.4921 31.0351 47.317 29.5856 47.317C23.5529 47.317 18.6617 42.4292 18.6562 36.3978V36.3775C18.6617 30.3461 23.5529 25.4583 29.5856 25.4583Z"
        fill="white"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M29.5868 8.67749L45.5503 8.67749C48.7109 8.67749 51.2731 11.2397 51.2731 14.4002C51.2731 17.5608 48.7109 20.123 45.5503 20.123L31.9874 20.123C30.6594 20.1323 29.5857 21.2117 29.5857 22.5419V22.5419H29.5856V23.2213C22.3185 23.222 16.4268 29.1103 16.4206 36.3762V36.3993C16.4241 40.5418 18.3408 44.2365 21.3346 46.6476C14.4743 43.5135 9.70703 36.5918 9.70703 28.5567C9.70703 17.5779 18.6069 8.67784 29.5856 8.6776L29.5856 20.123H29.5868L29.5868 8.67749ZM29.5856 39.3135V47.3171C23.5535 47.3164 18.6631 42.4289 18.6576 36.3978V36.3776C18.6631 30.3466 23.5535 25.4591 29.5856 25.4583V34.0644C28.1368 34.0652 26.9625 35.2399 26.9625 36.6889C26.9625 38.138 28.1368 39.3127 29.5856 39.3135ZM29.5856 37.0764V36.3015C29.5852 36.3015 29.5847 36.3015 29.5842 36.3015V37.0764C29.5847 37.0764 29.5852 37.0764 29.5856 37.0764Z"
        fill="white"
      />
    </svg>
  );
});
