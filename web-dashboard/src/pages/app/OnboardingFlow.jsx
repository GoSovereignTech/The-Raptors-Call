import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/raptor-ui.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet'; 
// ---------------------------------------------------------------------
// Live map — a real Leaflet map instead of hand-placed tile <img>s.
// Leaflet owns tile fetching/layout/zoom/pan, which is what actually
// guarantees the tiles line up: no more manual x/y pixel math to get
// wrong. onFail fires from the tile layer's own error event, so the
// "map tiles unavailable" banner still works the same way it did.
// ---------------------------------------------------------------------

/*
function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], map.getZoom(), { animate: true }); }, [lat, lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}*/




