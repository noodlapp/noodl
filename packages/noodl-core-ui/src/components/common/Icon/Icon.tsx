import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { TextType } from '@noodl-core-ui/components/typography/Text';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Icon.module.scss';

export enum IconName {
  AlignItemCenter = 'align_item_center',
  AlignItemLeft = 'align_item_left',
  AlignItemRight = 'align_item_right',
  ArrowDown = 'arrow_down',
  ArrowLeft = 'arrow_left',
  ArrowLineDown = 'arrow_line_down',
  ArrowLineLeft = 'arrow_line_left',
  ArrowLineRight = 'arrow_line_right',
  ArrowLineUp = 'arrow_line_up',
  ArrowRight = 'arrow_right',
  ArrowUp = 'arrow_up',
  ArrowsInLineHorizontal = 'arrows_in_line_horizontal',
  ArrowsInLineVertical = 'arrows_in_line_vertical',
  BorderAll = 'border_all',
  BorderDown = 'border_down',
  BorderLeft = 'border_left',
  BorderRight = 'border_right',
  BorderUp = 'border_up',
  Bug = 'bug',
  Cards = 'cards',
  CaretUp = 'caret_up',
  CaretDown = 'caret_down',
  CaretDownUp = 'caret_down_up',
  CaretLeft = 'caret_left',
  CaretRight = 'caret_right',
  Chat = 'chat',
  ChatFill = 'chat_fill',
  Check = 'check',
  Close = 'close',
  CloudCheck = 'cloud_check',
  CloudData = 'cloud_data',
  CloudDownload = 'cloud_download',
  CloudUpload = 'cloud_upload',
  CloudFunction = 'cloud_function',
  Collaboration = 'collaboration',
  Code = 'code',
  Component = 'component',
  ComponentWithChildren = 'component_with_children',
  Components = 'components',
  ComponentsFill = 'components_fill',
  Copy = 'copy',
  Columns = 'columns',
  DeviceDesktop = 'device_desktop',
  DeviceLaptop = 'device_laptop',
  DevicePhone = 'device_phone',
  DeviceTablet = 'device_tablet',
  Dimension = 'dimension',
  DimensionHeight = 'dimension_height',
  DimensionWidthHeight = 'dimension_width_height',
  DimenstionWidth = 'dimenstion_width',
  DotsThree = 'dots_three',
  DotsThreeHorizontal = 'dots_three_horizontal',
  ExternalLink = 'external_link',
  File = 'file',
  FileFill = 'file_fill',
  FolderOpen = 'folder_open',
  FolderClosed = 'folder_closed',
  Home = 'home',
  HomeFill = 'home_fill',
  HorizontalSplit = 'horizontal_split',
  JustifyContentCenter = 'justify_content_center',
  JustifyContentEnd = 'justify_content_end',
  JustifyContentSpaceAround = 'justify_content_space_around',
  JustifyContentSpaceBetween = 'justify_content_space_between',
  JustifyContentSpaceEvenly = 'justify_content_space_evenly',
  JustifyContentStart = 'justify_content_start',
  Logo = 'logo',
  MagicWand = 'magic_wand',
  Minus = 'minus',
  NestedComponent = 'nested_component',
  NotePencil = 'note_pencil',
  Palette = 'palette',
  PaletteFill = 'palette_fill',
  PauseCircle = 'pause_circle',
  Pencil = 'pencil',
  PencilLine = 'pencil_line',
  Play = 'play',
  PlayCircle = 'play_circle',
  Plus = 'plus',
  PlusSquare = 'plus_square',
  PlusCircle = 'plus_circle',
  Question = 'question',
  QuestionFill = 'question_fill',
  QuestionFree = 'question_free',
  Refresh = 'refresh',
  Reset = 'reset',
  RestApi = 'rest_api',
  Rocket = 'rocket',
  Roll = 'roll',
  RoundedCornerAll = 'rounded_corner_all',
  RoundedCornerLeftDown = 'rounded_corner_left_down',
  RoundedCornerLeftUp = 'rounded_corner_left_up',
  RoundedCornerRightDown = 'rounded_corner_right_down',
  RoundedCornerRightUp = 'rounded_corner_right_up',
  Search = 'search',
  SearchCorner = 'search_corner',
  SearchGrid = 'search_grid',
  SearchSquare = 'search_square',
  Setting = 'setting',
  SettingFill = 'setting_fill',
  Sliders = 'sliders',
  SlidersHorizontal = 'sliders_horizontal',
  Stash = 'stash',
  StructureCircle = 'structure_circle',
  Square = 'square',
  SquareFilled = 'square_filled',
  SquareHalf = 'square_half',
  TextAlignCenter = 'text_align_center',
  TextAlignLeft = 'text_align_left',
  TextAlignRight = 'text_align_right',
  Trash = 'trash',
  User = 'user',
  UI = 'ui',
  VerticalSplit = 'vertical_split',
  ViewportDiagonalArrow = 'viewport_diagonal_arrow',
  ViewportHorizontalArrow = 'viewport_horizontal_arrow',
  ViewportVerticalArrow = 'viewport_vertical_arrow',
  WarningCircle = 'warning_circle',
  WarningCircleFilled = 'warning_circle_filled',
  WarningTriangle = 'warning_triangle',
  ImportDown = 'import_down',
  ImportLeft = 'import_left',
  ImportSlanted = 'import_slanted',
  Grip = 'grip',
  Group = 'group',
  TextInBox = 'text_in_box',
  Image = 'image',
  Video = 'video',
  CircleOpen = 'circle_open',
  CircleDot = 'circle_dot',
  Star = 'star',
  Button = 'button',
  Checkbox = 'checkbox',
  CheckboxFilled = 'checkbox_filled',
  Icon = 'icon',
  Dropdown = 'dropdown',
  DropdownLines = 'dropdown_lines',
  TextInput = 'text_input',
  PageRouter = 'page_router',
  PageInputArrow = 'page_input_arrow',
  Radiobutton = 'radiobutton',
  RadiobuttonGroupLine = 'radiobutton_group_line',
  RadiobuttonGroup = 'radiobutton_group',
  SlidersFilled = 'sliders_filled',
  Navigate = 'navigate',
  Link = 'link',
  SEO = 'seo'
}

export enum IconSize {
  Default = 'is-size-default',
  Large = 'is-size-large',
  Small = 'is-size-small',
  Tiny = 'is-size-tiny'
}

export type IconVariant = FeedbackType | TextType;

export interface IconProps extends UnsafeStyleProps {
  icon: IconName;
  size?: IconSize;
  variant?: IconVariant;
}

/** Require all SVGs in folder so that we dont have to type them in manually */
const reqSvgs = require.context('@noodl-core-ui/assets/icons/icon-component', true, /\.svg$/);

/** Create object from all required SVGs so that we can access them */
const _IconObject = reqSvgs.keys().reduce((images, path) => {
  const key = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
  images[key] = reqSvgs(path);
  return images;
}, {});

export function Icon({
  icon = IconName.BorderAll,
  size = IconSize.Default,
  variant,
  UNSAFE_className,
  UNSAFE_style
}: IconProps) {
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    if (typeof _IconObject[icon] === 'object') {
      setSvg(_IconObject[icon].ReactComponent);
    } else {
      fetch(_IconObject[icon])
        .then((res) => res.text())
        .then(setSvg);
    }
  }, [icon]);

  if (typeof svg === 'string') {
    return (
      <span
        className={classNames(css['Root'], css[size], variant && css[`is-variant-${variant}`], UNSAFE_className)}
        style={UNSAFE_style}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  } else {
    const SvgTag = svg;
    return (
      <span
        className={classNames(css['Root'], css[size], variant && css[`is-variant-${variant}`], UNSAFE_className)}
        style={UNSAFE_style}
      >
        {SvgTag && <SvgTag />}
      </span>
    );
  }
}
