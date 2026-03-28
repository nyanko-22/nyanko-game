import Matter from 'matter-js';
import { CATS } from './constants';

export function createCat(level: number, x: number, y: number): Matter.Body {
  const cat = CATS[level];
  const body = Matter.Bodies.circle(x, y, cat.radius, {
    restitution: 0.2,
    friction: 0.5,
    density: 0.002,
    label: cat.name,
    plugin: {
      catLevel: level,
      markedForRemoval: false,
      graceFrames: 0,
    },
  });
  return body;
}
