# Design Document

## Overview

The image format optimization feature enhances the existing Next.js Image component configuration to automatically serve modern image formats (AVIF, WebP) with PNG fallbacks. This implementation leverages Next.js built-in image optimization capabilities to provide significant performance improvements without requiring changes to existing code.

## Architecture

### Image Format Priority

1. **AVIF** - Highest compression, newest format (up to 50% smaller than WebP)
2. **WebP** - Good compression, wide browser support (60-80% smaller than PNG)
3. **PNG** - Fallback format for maximum compatibility

### Next.js Image Optimization Pipeline

```
Original PNG → Next.js Image Optimizer → Format Detection → Optimized Delivery
                                      ↓
                              Browser Capability Check
                                      ↓
                              AVIF → WebP → PNG (fallback)
```

## Components and Interfaces

### Configuration Changes

#### next.config.mjs Enhancement

- Add `formats` array to specify preferred image formats
- Configure `minimumCacheTTL` for optimal caching
- Set appropriate `deviceSizes` and `imageSizes` for responsive images
- Maintain existing PWA and MDX configurations

#### Image Component Enhancements

- Update `GameImage` component to leverage new formats
- Add proper `sizes` attribute for responsive loading
- Implement blur placeholder for better loading experience
- Maintain backward compatibility with existing props

### Caching Strategy

- **Browser Cache**: 1 year TTL for optimized images
- **CDN Cache**: Automatic via Vercel's image optimization
- **Service Worker**: Enhanced caching for offline support

## Data Models

### Image Configuration Interface

```typescript
interface ImageConfig {
  formats: string[];
  minimumCacheTTL: number;
  deviceSizes: number[];
  imageSizes: number[];
  dangerouslyAllowSVG?: boolean;
  contentSecurityPolicy?: string;
}
```

### Enhanced GameImage Props

```typescript
interface GameImageProps {
  src: string;
  alt: string;
  size: ImageSize;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
}
```

## Error Handling

### Format Fallback Chain

1. Attempt AVIF delivery
2. If AVIF fails → attempt WebP
3. If WebP fails → serve original PNG
4. If all fail → show error placeholder

### Network Error Handling

- Implement retry logic for failed image loads
- Provide offline fallback through service worker
- Log optimization failures for monitoring

## Testing Strategy

### Performance Testing

- Measure LCP improvements before/after implementation
- Test bandwidth reduction across different image types
- Verify caching behavior in various browsers

### Compatibility Testing

- Test format support across target browsers
- Verify fallback behavior in older browsers
- Test on various device types and screen sizes

### Integration Testing

- Verify existing image references continue working
- Test PWA offline functionality with optimized images
- Ensure service worker caching works with new formats

## Implementation Notes

### Browser Support Matrix

- **AVIF**: Chrome 85+, Firefox 93+, Safari 16.1+
- **WebP**: Chrome 23+, Firefox 65+, Safari 14+
- **PNG**: Universal support (fallback)

### Performance Expectations

- **File Size Reduction**: 60-80% average
- **Loading Speed**: 40-60% improvement
- **LCP Impact**: 30-50% improvement
- **Bandwidth Savings**: Significant for mobile users

### Security Considerations

- Maintain existing CSP policies
- Ensure image optimization doesn't expose sensitive paths
- Validate image sources to prevent abuse
