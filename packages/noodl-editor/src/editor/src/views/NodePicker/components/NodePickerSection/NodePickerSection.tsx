import React, { ReactChild, ReactNode } from 'react';
import css from './NodePickerSection.module.scss';

interface NodePickerSectionProps {
  title: string;
  children?: ReactNode;
}

export default function NodePickerSection({ title, children }: NodePickerSectionProps) {
  return (
    <div>
      <div>{children}</div>
    </div>
  );
}
