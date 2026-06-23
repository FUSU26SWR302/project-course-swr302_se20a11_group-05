import { FeatureCollection } from "geojson";

export const WARD_CENTERS: Record<string, [number, number]> = {
  "Hải Châu": [16.044, 108.220],
  "Thanh Khê": [16.060, 108.192],
  "Sơn Trà": [16.084, 108.246],
  "Ngũ Hành Sơn": [16.027, 108.246],
  "Liên Chiểu": [16.072, 108.150],
  "Cẩm Lệ": [16.020, 108.200],
  "Hòa Vang": [15.990, 108.120],
};

export const WARD_BOUNDARIES: Record<string, FeatureCollection> = {
  "Hải Châu": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Hải Châu" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.210, 16.035],
              [108.230, 16.035],
              [108.230, 16.055],
              [108.210, 16.055],
              [108.210, 16.035],
            ],
          ],
        },
      },
    ],
  },
  "Thanh Khê": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Thanh Khê" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.180, 16.050],
              [108.204, 16.050],
              [108.204, 16.070],
              [108.180, 16.070],
              [108.180, 16.050],
            ],
          ],
        },
      },
    ],
  },
  "Sơn Trà": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Sơn Trà" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.230, 16.070],
              [108.260, 16.070],
              [108.260, 16.100],
              [108.230, 16.100],
              [108.230, 16.070],
            ],
          ],
        },
      },
    ],
  },
  "Ngũ Hành Sơn": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Ngũ Hành Sơn" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.230, 16.010],
              [108.260, 16.010],
              [108.260, 16.040],
              [108.230, 16.040],
              [108.230, 16.010],
            ],
          ],
        },
      },
    ],
  },
  "Liên Chiểu": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Liên Chiểu" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.130, 16.055],
              [108.170, 16.055],
              [108.170, 16.090],
              [108.130, 16.090],
              [108.130, 16.055],
            ],
          ],
        },
      },
    ],
  },
  "Cẩm Lệ": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Cẩm Lệ" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.185, 16.005],
              [108.215, 16.005],
              [108.215, 16.035],
              [108.185, 16.035],
              [108.185, 16.005],
            ],
          ],
        },
      },
    ],
  },
  "Hòa Vang": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Hòa Vang" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.080, 15.960],
              [108.160, 15.960],
              [108.160, 16.020],
              [108.080, 16.020],
              [108.080, 15.960],
            ],
          ],
        },
      },
    ],
  },
};
