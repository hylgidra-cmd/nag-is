import { ImageResponse } from 'next/og';

/** Favicon generated from the brand mark, so there is no raster asset. */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 3,
          padding: 6,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #2f66f6 0%, #7c5cf0 55%, #0e9f8f 100%)',
        }}
      >
        <div style={{ width: 4, height: 7, borderRadius: 2, background: '#fff' }} />
        <div style={{ width: 4, height: 12, borderRadius: 2, background: '#fff' }} />
        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#fff' }} />
      </div>
    ),
    size,
  );
}
