export interface CatLevel {
  name: string;
  radius: number;
  color: string;
  darkColor: string;
  score: number;
}

export const CATS: CatLevel[] = [
  { name: '子猫',           radius: 15,  color: '#FFD4A3', darkColor: '#E0B080', score: 0 },
  { name: 'ミケ猫',         radius: 19,  color: '#FF9966', darkColor: '#CC7744', score: 1 },
  { name: 'シャム猫',       radius: 24,  color: '#F5E6D3', darkColor: '#8B7355', score: 3 },
  { name: 'スコティッシュ', radius: 30,  color: '#C4A882', darkColor: '#8B7355', score: 6 },
  { name: 'ペルシャ',       radius: 37,  color: '#F0F0F0', darkColor: '#C0C0C0', score: 10 },
  { name: 'メインクーン',   radius: 46,  color: '#A0522D', darkColor: '#6B3A1F', score: 15 },
  { name: 'ベンガル',       radius: 56,  color: '#DAA520', darkColor: '#8B6914', score: 21 },
  { name: 'ラグドール',     radius: 69,  color: '#E8D8C8', darkColor: '#A89888', score: 28 },
  { name: 'サバンナ',       radius: 85,  color: '#D4A574', darkColor: '#8B6914', score: 36 },
  { name: 'ライオン',       radius: 104, color: '#DAA520', darkColor: '#8B6914', score: 45 },
  { name: '猫神様',         radius: 128, color: '#FFD700', darkColor: '#B8860B', score: 55 },
];

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const CONTAINER_X = 30;
export const CONTAINER_Y = 100;
export const CONTAINER_WIDTH = 300;
export const CONTAINER_HEIGHT = 500;
export const WALL_THICKNESS = 10;
export const DEATH_LINE_Y = CONTAINER_Y + 40;
export const DROP_Y = CONTAINER_Y - 10;
export const DROP_COOLDOWN_MS = 500;
export const MAX_DROP_LEVEL = 4;
export const DEATH_GRACE_FRAMES = 60;
export const MAX_RANKING_ENTRIES = 20;
export const SCREENSHOT_QUALITY = 0.7;
