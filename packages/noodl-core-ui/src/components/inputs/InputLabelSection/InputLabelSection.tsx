import React from 'react';
import css from './InputLabelSection.module.scss';

export interface InputLabelSectionProps {
  label: string;
}

export function InputLabelSection({ label }: InputLabelSectionProps) {
  return <div className={css['Root']}>{label}</div>;
}
