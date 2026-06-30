'use client';

import { useContext } from 'react';
import { PwaContext } from '../core/PwaProvider';

export function usePwa() {
  return useContext(PwaContext);
}