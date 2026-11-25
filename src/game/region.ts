/**
 * Cấu hình theo vùng phát hành (lộ trình phát hành 26/11/2026, mục 2 "Region Feature Flags").
 * Mặc định "quoc_te": không hiện nhãn tuổi / cảnh báo. Bản Việt Nam đi thẩm định: build với VITE_REGION=vn
 * (hoặc xem thử bằng ?vung=vn) → hiện nhãn độ tuổi và dòng khuyến cáo sức khoẻ theo quy định trò chơi điện tử.
 */
export type Region = 'quoc_te' | 'vn';

export function currentRegion(): Region {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('vung') : null;
  if (q === 'vn' || q === 'quoc_te') return q;
  const env = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_REGION;
  return env === 'vn' ? 'vn' : 'quoc_te';
}

export interface RegionFlags {
  /** Nhãn phân loại độ tuổi (vd "00+") */
  ageLabel: string | null;
  /** Dòng khuyến cáo sức khoẻ */
  healthWarning: string | null;
}

export function regionFlags(r: Region = currentRegion()): RegionFlags {
  if (r === 'vn') {
    return { ageLabel: '00+', healthWarning: 'Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe' };
  }
  return { ageLabel: null, healthWarning: null };
}
