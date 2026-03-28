import type Matter from 'matter-js';
import {
  CATS, GAME_WIDTH, GAME_HEIGHT,
  CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT,
  WALL_THICKNESS, DEATH_LINE_Y, DROP_Y,
} from './constants';
import type { Particle } from './game';

export function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.maxWidth = '100vw';
  canvas.style.maxHeight = '100vh';
  canvas.style.aspectRatio = `${GAME_WIDTH}/${GAME_HEIGHT}`;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.cursor = 'pointer';
  return canvas;
}

function drawCatFace(ctx: CanvasRenderingContext2D, level: number, radius: number): void {
  const cat = CATS[level];

  // Body circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = cat.color;
  ctx.fill();
  ctx.strokeStyle = cat.darkColor;
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.stroke();

  // Ears
  const earSize = radius * 0.45;
  const earOffset = radius * 0.55;
  ctx.fillStyle = cat.color;
  ctx.strokeStyle = cat.darkColor;

  // Left ear
  ctx.beginPath();
  ctx.moveTo(-earOffset - earSize * 0.5, -radius * 0.6);
  ctx.lineTo(-earOffset, -radius * 0.6 - earSize);
  ctx.lineTo(-earOffset + earSize * 0.5, -radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.moveTo(earOffset - earSize * 0.5, -radius * 0.6);
  ctx.lineTo(earOffset, -radius * 0.6 - earSize);
  ctx.lineTo(earOffset + earSize * 0.5, -radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner ears (pink)
  const innerEarSize = earSize * 0.55;
  ctx.fillStyle = '#FFB6C1';

  ctx.beginPath();
  ctx.moveTo(-earOffset - innerEarSize * 0.4, -radius * 0.62);
  ctx.lineTo(-earOffset, -radius * 0.62 - innerEarSize);
  ctx.lineTo(-earOffset + innerEarSize * 0.4, -radius * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(earOffset - innerEarSize * 0.4, -radius * 0.62);
  ctx.lineTo(earOffset, -radius * 0.62 - innerEarSize);
  ctx.lineTo(earOffset + innerEarSize * 0.4, -radius * 0.62);
  ctx.closePath();
  ctx.fill();

  // Eyes
  const eyeOffsetX = radius * 0.3;
  const eyeOffsetY = -radius * 0.1;
  const eyeWidth = radius * 0.18;
  const eyeHeight = radius * 0.22;

  // Siamese: darker face area
  if (level === 2) {
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#8B735580';
    ctx.fill();
  }

  // Scottish Fold: folded ears (override ear tips)
  if (level === 3) {
    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.moveTo(-earOffset - earSize * 0.5, -radius * 0.6);
    ctx.lineTo(-earOffset, -radius * 0.6 - earSize * 0.5);
    ctx.lineTo(-earOffset + earSize * 0.5, -radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(earOffset - earSize * 0.5, -radius * 0.6);
    ctx.lineTo(earOffset, -radius * 0.6 - earSize * 0.5);
    ctx.lineTo(earOffset + earSize * 0.5, -radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Calico patches
  if (level === 1) {
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513AA';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.25, radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#333333AA';
    ctx.fill();
  }

  // Lion mane
  if (level === 9) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = radius * 0.15;
    ctx.stroke();
  }

  // Cat God crown/glow
  if (level === 10) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD70066';
    ctx.lineWidth = radius * 0.2;
    ctx.stroke();

    // Crown
    const crownY = -radius * 0.85;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, crownY);
    ctx.lineTo(-radius * 0.3, crownY - radius * 0.3);
    ctx.lineTo(-radius * 0.1, crownY - radius * 0.1);
    ctx.lineTo(0, crownY - radius * 0.35);
    ctx.lineTo(radius * 0.1, crownY - radius * 0.1);
    ctx.lineTo(radius * 0.3, crownY - radius * 0.3);
    ctx.lineTo(radius * 0.4, crownY);
    ctx.closePath();
    ctx.fill();
  }

  // White eye background
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#333333';
  const pupilSize = eyeWidth * 0.55;
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, pupilSize, pupilSize * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, pupilSize, pupilSize * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFFFFF';
  const shineSize = pupilSize * 0.35;
  ctx.beginPath();
  ctx.arc(-eyeOffsetX - pupilSize * 0.2, eyeOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX - pupilSize * 0.2, eyeOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#FF8899';
  ctx.beginPath();
  const noseY = radius * 0.15;
  ctx.moveTo(0, noseY - radius * 0.06);
  ctx.lineTo(-radius * 0.06, noseY + radius * 0.04);
  ctx.lineTo(radius * 0.06, noseY + radius * 0.04);
  ctx.closePath();
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#FF8899';
  ctx.lineWidth = Math.max(1, radius * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, noseY + radius * 0.04);
  ctx.lineTo(0, noseY + radius * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-radius * 0.08, noseY + radius * 0.12, radius * 0.08, -Math.PI * 0.1, Math.PI * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radius * 0.08, noseY + radius * 0.12, radius * 0.08, Math.PI * 0.2, Math.PI * 1.1);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = cat.darkColor;
  ctx.lineWidth = Math.max(0.5, radius * 0.02);
  const whiskerLen = radius * 0.5;
  const whiskerX = radius * 0.2;
  const whiskerY = noseY + radius * 0.06;

  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-whiskerX, whiskerY + i * radius * 0.06);
    ctx.lineTo(-whiskerX - whiskerLen, whiskerY + i * radius * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(whiskerX, whiskerY + i * radius * 0.06);
    ctx.lineTo(whiskerX + whiskerLen, whiskerY + i * radius * 0.1);
    ctx.stroke();
  }

  // Name label (only for larger cats)
  if (radius >= 30) {
    ctx.fillStyle = '#00000088';
    ctx.font = `bold ${Math.min(radius * 0.3, 14)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cat.name, 0, radius - radius * 0.1);
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  bodies: Matter.Body[],
  state: 'title' | 'playing' | 'gameover',
  cursorX: number,
  currentLevel: number,
  nextLevel: number,
  score: number,
  highScore: number,
  particles: Particle[],
): void {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Container background
  ctx.fillStyle = '#16213e';
  ctx.fillRect(CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT);

  // Container walls
  ctx.fillStyle = '#4a3728';
  // Left wall
  ctx.fillRect(CONTAINER_X - WALL_THICKNESS, CONTAINER_Y, WALL_THICKNESS, CONTAINER_HEIGHT + WALL_THICKNESS);
  // Right wall
  ctx.fillRect(CONTAINER_X + CONTAINER_WIDTH, CONTAINER_Y, WALL_THICKNESS, CONTAINER_HEIGHT + WALL_THICKNESS);
  // Bottom wall
  ctx.fillRect(CONTAINER_X - WALL_THICKNESS, CONTAINER_Y + CONTAINER_HEIGHT, CONTAINER_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS);

  // Death line
  ctx.strokeStyle = '#FF444466';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(CONTAINER_X, DEATH_LINE_Y);
  ctx.lineTo(CONTAINER_X + CONTAINER_WIDTH, DEATH_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (state === 'title') {
    drawTitleScreen(ctx);
    return;
  }

  // Drop guide line
  if (state === 'playing') {
    ctx.strokeStyle = '#FFFFFF33';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cursorX, DROP_Y);
    ctx.lineTo(cursorX, CONTAINER_Y + CONTAINER_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview of current cat at drop position
    const previewCat = CATS[currentLevel];
    ctx.save();
    ctx.translate(cursorX, DROP_Y);
    drawCatFace(ctx, currentLevel, previewCat.radius);
    ctx.restore();
  }

  // Draw cat bodies
  for (const body of bodies) {
    if (body.isStatic) continue;
    const plugin = body.plugin as Record<string, unknown>;
    if (plugin.catLevel === undefined) continue;

    const level = plugin.catLevel as number;
    const cat = CATS[level];

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    drawCatFace(ctx, level, cat.radius);
    ctx.restore();
  }

  // Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Score display
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${score}`, 10, 10);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText(`BEST: ${highScore}`, 10, 34);

  // Next cat preview (top right)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('NEXT', GAME_WIDTH - 15, 10);

  const nextCat = CATS[nextLevel];
  ctx.save();
  ctx.translate(GAME_WIDTH - 40, 50);
  drawCatFace(ctx, nextLevel, Math.min(nextCat.radius, 18));
  ctx.restore();

  // Game over overlay
  if (state === 'gameover') {
    drawGameOverScreen(ctx, score, highScore);
  }
}

function drawTitleScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#00000088';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('にゃんこゲーム', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

  // Draw a cute cat icon
  ctx.save();
  ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  drawCatFace(ctx, 0, 40);
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px sans-serif';
  ctx.fillText('タップしてスタート', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('同じ猫同士をくっつけて', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
  ctx.fillText('大きな猫を作ろう!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160);
}

function drawGameOverScreen(ctx: CanvasRenderingContext2D, score: number, highScore: number): void {
  ctx.fillStyle = '#000000AA';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#FF6666';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px sans-serif';
  ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('NEW BEST!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
  }

  ctx.fillStyle = '#AAAAAA';
  ctx.font = '18px sans-serif';
  ctx.fillText('タップしてリスタート', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}
