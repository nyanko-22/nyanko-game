import Matter from 'matter-js';
import {
  CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT,
  WALL_THICKNESS, CATS,
} from './constants';
import { createCat } from './cats';

export interface MergeEvent {
  fromLevel: number;
  newLevel: number;
  x: number;
  y: number;
}

interface PendingMerge {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  level: number;
}

const mergeQueue: PendingMerge[] = [];
let mergeCallback: ((event: MergeEvent) => void) | null = null;

export let engine: Matter.Engine;
export let world: Matter.World;

export function initPhysics(): void {
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 },
  });
  engine.enableSleeping = true;
  world = engine.world;

  const cx = CONTAINER_X;
  const cy = CONTAINER_Y;
  const cw = CONTAINER_WIDTH;
  const ch = CONTAINER_HEIGHT;
  const wt = WALL_THICKNESS;

  const wallOptions = {
    isStatic: true,
    friction: 0.5,
  } as const;

  const leftWall = Matter.Bodies.rectangle(
    cx - wt / 2, cy + ch / 2, wt, ch + wt, wallOptions
  );
  const rightWall = Matter.Bodies.rectangle(
    cx + cw + wt / 2, cy + ch / 2, wt, ch + wt, wallOptions
  );
  const bottomWall = Matter.Bodies.rectangle(
    cx + cw / 2, cy + ch + wt / 2, cw + wt * 2, wt, wallOptions
  );

  Matter.Composite.add(world, [leftWall, rightWall, bottomWall]);

  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      if (bodyA.isStatic || bodyB.isStatic) continue;

      const pluginA = bodyA.plugin as Record<string, unknown>;
      const pluginB = bodyB.plugin as Record<string, unknown>;

      if (pluginA.markedForRemoval || pluginB.markedForRemoval) continue;
      if (pluginA.catLevel === undefined || pluginB.catLevel === undefined) continue;

      const levelA = pluginA.catLevel as number;
      const levelB = pluginB.catLevel as number;

      if (levelA === levelB && levelA < CATS.length - 1) {
        pluginA.markedForRemoval = true;
        pluginB.markedForRemoval = true;
        mergeQueue.push({ bodyA, bodyB, level: levelA });
      }
    }
  });

  Matter.Events.on(engine, 'afterUpdate', () => {
    while (mergeQueue.length > 0) {
      const merge = mergeQueue.pop()!;
      const midX = (merge.bodyA.position.x + merge.bodyB.position.x) / 2;
      const midY = (merge.bodyA.position.y + merge.bodyB.position.y) / 2;

      Matter.Composite.remove(world, merge.bodyA);
      Matter.Composite.remove(world, merge.bodyB);

      const newLevel = merge.level + 1;
      const newCat = createCat(newLevel, midX, midY);
      Matter.Composite.add(world, newCat);

      if (mergeCallback) {
        mergeCallback({ fromLevel: merge.level, newLevel, x: midX, y: midY });
      }
    }
  });
}

export function onMerge(callback: (event: MergeEvent) => void): void {
  mergeCallback = callback;
}

export function stepPhysics(delta: number): void {
  Matter.Engine.update(engine, delta);
}

export function addBody(body: Matter.Body): void {
  Matter.Composite.add(world, body);
}

export function getAllBodies(): Matter.Body[] {
  return Matter.Composite.allBodies(world);
}

export function clearCats(): void {
  const bodies = Matter.Composite.allBodies(world);
  for (const body of bodies) {
    if (!body.isStatic) {
      Matter.Composite.remove(world, body);
    }
  }
  mergeQueue.length = 0;
}
