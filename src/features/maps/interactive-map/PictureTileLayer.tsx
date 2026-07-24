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
    let completed = false;

    const finish = (error?: Error) => {
      if (completed) return;
      completed = true;
      done(error, picture);
    };

    picture.className = 'leaflet-picture-tile';
    image.className = 'leaflet-picture-tile-image';
    image.alt = '';
    image.decoding = 'async';

    if (avifUrl && avifUrl !== webpUrl) {
      source.type = 'image/avif';
      source.srcset = avifUrl;
      picture.append(source);
    }
    picture.append(image);

    image.onload = () => finish();
    image.onerror = () => {
      if (isAvifUrl(image.currentSrc || image.src)) {
        source.removeAttribute('srcset');
        image.src = webpUrl;
        return;
      }

      finish(new Error('地图瓦片加载失败'));
    };
    image.src = webpUrl;

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
