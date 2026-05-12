import { readFileSync } from 'fs';
import path from 'path';

describe('detail image alt conventions', () => {
  it('treats SingleItemButton images as decorative beside visible item text', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/ui/SingleItemButton.tsx'),
      'utf8'
    );

    expect(source).toContain("alt=''");
    expect(source).not.toContain('alt={`${singleItem.name}图标`}');
  });

  it('uses the map name in map preview image alt text', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/features/maps/map-detail/MapDetails.tsx'),
      'utf8'
    );

    expect(source).toContain('alt={`${effectiveMap.name}地图预览`}');
    expect(source).not.toContain("alt={'地图缩略图'}");
    expect(source).not.toContain("alt={'地图全屏预览'}");
  });
});
