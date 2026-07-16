'use client';

import { useEffect } from 'react';
import L, { type Coords, type DoneCallback, type TileLayerOptions } from 'leaflet';
import { useMap } from 'react-leaflet';

import { getInteractiveMapAssetUrl } from './mapUtils';

const isAvifUrl = (url: string) => {
  const urlWithoutQuery = url.split(/[?#]/u)[0] ?? url;
  return urlWithoutQuery.toLowerCase().endsWith('.avif');
};

class NativePictureTileLayer extends L.TileLayer {
  protected override createTile(coords: Coords, done: DoneCallback): HTMLElement {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    const image = document.createElement('img');
    const webpUrl = this.getTileUrl(coords);
    const avifUrl = getInteractiveMapAssetUrl(webpUrl, 'avif');

    picture.className = 'leaflet-picture-tile';
    image.className = 'leaflet-picture-tile-image';
    image.alt = '';
    image.decoding = 'async';

    if (avifUrl && avifUrl !== webpUrl) {
      source.type = 'image/avif';
      source.srcset = avifUrl;
      picture.append(source);
    }

    image.onload = () => done(undefined, picture);
    image.onerror = () => {
      if (isAvifUrl(image.currentSrc || image.src)) {
        source.removeAttribute('srcset');
        image.src = webpUrl;
        return;
      }

      done(new Error('地图瓦片加载失败'), picture);
    };
    image.src = webpUrl;
    picture.append(image);

    return picture;
  }
}

type PictureTileLayerProps = {
  url: string;
  options: TileLayerOptions;
  onTileError: () => void;
};

export function PictureTileLayer({ url, options, onTileError }: PictureTileLayerProps) {
  const map = useMap();

  useEffect(() => {
    const layer = new NativePictureTileLayer(url, options);
    layer.on('tileerror', onTileError);
    layer.addTo(map);

    return () => {
      layer.off('tileerror', onTileError);
      map.removeLayer(layer);
    };
  }, [map, onTileError, options, url]);

  return null;
}
