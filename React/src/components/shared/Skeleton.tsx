import React from 'react';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}


export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = 4, style }) => (
  <div
    className="skeleton-shimmer"
    aria-hidden="true"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);
