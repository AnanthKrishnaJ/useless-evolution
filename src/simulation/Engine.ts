import { Creature, Entity, Genes, HistoryPoint, SimEvent, WorldState, SpeciesRecord, SimulationSettings } from '../types';

const SYLLABLES = ["ba", "ka", "do", "re", "mi", "fa", "so", "la", "ti", "zo", "ru", "ma", "ga", "ze", "vu", "xi", "po", "nu", "ki", "je"];
export function generateSpeciesName(parent?: string) {
  const len = Math.floor(Math.random() * 2) + 2;
  let name = "";
  for(let i=0; i<len; i++) name += SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export class SimulationEngine {
  public state: WorldState;
  public width: number;
  public height: number;
  public settings: SimulationSettings;
  
  public tickCount = 0;
  private nextId = 1;
  private nextEntityId = 1;
  private nextEventId = 1;
  
  private readonly MATURE_AGE = 5;
  private readonly REPRODUCTION_COST = 40;

  constructor(width: number, height: number, existingState?: any) {
    this.width = width;
    this.height = height;
    
    this.settings = {
      startingPopulation: 50,
      mutationRate: 0.05,
      speciesThreshold: 30,
      foodAbundance: 0.5,
      randomEvents: true
    };

    if (existingState && existingState.settings) {
        this.settings = { ...this.settings, ...existingState.settings };
    }

    this.state = this.getInitialState();
    if (existingState && existingState.state) {
        // Hydrate legacy creatures
        existingState.state.creatures = (existingState.state.creatures || []).map(c => ({
            ...c,
            health: c.health || 100,
            maxHealth: c.maxHealth || 100,
            ageDays: c.ageDays || 0,
            genes: {
               size: c.genes?.size || 20,
               speed: c.genes?.speed || 30,
               vision: c.genes?.vision || 50,
               color: c.genes?.color || '#ffffff',
               lifespan: c.genes?.lifespan || 80,
               energyEfficiency: c.genes?.energyEfficiency || 50
            }
        }));
        // Hydrate species registry
        if (!existingState.state.speciesRegistry) existingState.state.speciesRegistry = {};

        this.state = existingState.state;
        this.tickCount = existingState.tickCount || 0;
        // Fix max ID
        for (const c of this.state.creatures) {
           const idNum = parseInt(c.id.replace('c_', ''));
           if (!isNaN(idNum) && idNum >= this.nextId) this.nextId = idNum + 1;
        }
    } else {
        this.init();
    }
  }

  public getInitialState(): WorldState {
      return {
          creatures: [],
          entities: [],
          day: 1,
          generation: 1,
          events: [],
          history: [],
          speciesRegistry: {},
          activeUselessEffect: 'none',
          effectTimer: 0,
      };
  }

  public init() {
    this.state = this.getInitialState();
    this.tickCount = 0;
    
    // Founding species
    const founders: string[] = [];
    for(let i=0; i<4; i++) {
        const name = generateSpeciesName();
        founders.push(name);
        this.state.speciesRegistry[name] = {
            name,
            generationDiscovered: 1,
            parentSpecies: null,
            status: 'living',
            avgSize: 0, avgSpeed: 0, avgLifespan: 0
        };
    }

    for (let i = 0; i < 40; i++) this.spawnEntity('rock');

    for (let i = 0; i < this.settings.startingPopulation; i++) {
      this.spawnCreature(founders[Math.floor(Math.random() * founders.length)]);
    }

    for (let i = 0; i < 200; i++) {
      this.spawnEntity('food');
    }
    
    this.updateSpeciesStats();
    this.addEvent(`Simulation started with ${this.settings.startingPopulation} creatures across ${founders.length} species.`, 'normal');
  }

  public update() {
    this.tickCount++;
    
    // 1 Day = 100 Ticks
    const isNewDay = this.tickCount % 100 === 0;
    if (isNewDay) {
        this.state.day++;
    }

    // Process entities with timers
    for (let i = this.state.entities.length - 1; i >= 0; i--) {
       const ent = this.state.entities[i];
       if (ent.timer !== undefined) {
          ent.timer--;
          if (ent.timer <= 0) {
             this.state.entities.splice(i, 1);
          }
       }
    }
    
    // Spawn food based on abundance setting
    const foodCount = this.state.entities.filter(e => e.type === 'food').length;
    const maxFood = 400 * this.settings.foodAbundance;
    if (foodCount < maxFood && Math.random() < this.settings.foodAbundance * 0.1) {
      this.spawnEntity('food');
    }
    
    // Random Events
    if (this.state.effectTimer > 0) {
      this.state.effectTimer--;
      if (this.state.effectTimer <= 0) {
        this.state.activeUselessEffect = 'none';
      }
    } else if (this.settings.randomEvents && Math.random() < 0.0005) {
      this.triggerRandomUselessEvent();
    }

    // Process creatures
    const newCreatures: Creature[] = [];
    const deadCreatureIds = new Set<string>();
    
    const CELL_SIZE = 50;
    const grid = new Map<string, Creature[]>();
    for (const c of this.state.creatures) {
      const cell = `${Math.floor(c.x / CELL_SIZE)},${Math.floor(c.y / CELL_SIZE)}`;
      if (!grid.has(cell)) grid.set(cell, []);
      grid.get(cell)!.push(c);
    }
    
    for (const c of this.state.creatures) {
      if (c.action === 'dead') {
          deadCreatureIds.add(c.id);
          continue;
      }

      if (c.action === 'isDying') {
          c.actionTimer--;
          c.vx *= 0.8;
          c.vy *= 0.8;
          c.x += c.vx;
          c.y += c.vy;
          if (c.actionTimer <= 0) {
              c.action = 'dead';
              deadCreatureIds.add(c.id);
              if (Math.random() < 0.4) this.spawnEntity('meat', c.x, c.y);
          }
          continue;
      }

      if (c.health <= 0) {
          c.action = 'isDying';
          c.actionTimer = 20;
          continue;
      }
      
      if (isNewDay) {
          c.ageDays++;
          if (c.ageDays > c.genes.lifespan) {
              c.health = 0; // Old age
          }
      }
      
      // Energy & Health
      let energyDrain = 0.02 + 0.01 * (c.genes.size / 20) + 0.01 * (c.genes.speed / 30);
      energyDrain *= (100 / c.genes.energyEfficiency); // more efficient = less drain

      if (c.energy > 0) {
          c.energy = Math.max(0, c.energy - energyDrain);
      } else {
          c.health -= 0.5; // Starving
      }

      // Action logic
      if (c.actionTimer > 0) {
        c.actionTimer--;
      } else {
        this.decideAction(c);
      }
      
      // Execute action
      switch (c.action) {
        case 'moving':
          if (Math.random() < 0.05) {
             const angle = Math.atan2(c.vy, c.vx) + (Math.random() - 0.5);
             const speed = c.genes.speed / 40;
             c.vx = Math.cos(angle) * speed;
             c.vy = Math.sin(angle) * speed;
          }
          c.x += c.vx;
          c.y += c.vy;
          c.energy = Math.max(0, c.energy - (0.05 * (c.genes.speed / 30)));
          break;
        case 'sleeping':
          c.energy = Math.max(0, c.energy - (energyDrain * 0.1)); // Very low drain
          break;
        case 'eating':
          if (c.targetId) {
             const foodIdx = this.state.entities.findIndex(e => e.id === c.targetId);
             if (foodIdx >= 0) {
               const dist = Math.hypot(this.state.entities[foodIdx].x - c.x, this.state.entities[foodIdx].y - c.y);
               const reach = (c.genes.size / 10) + 10;
               if (dist < reach) {
                 const food = this.state.entities[foodIdx];
                 this.state.entities.splice(foodIdx, 1);
                 c.energy += (food.type === 'meat' ? 60 : 40);
                 if (c.energy > c.maxEnergy) c.energy = c.maxEnergy;
                 c.targetId = undefined;
                 c.action = 'moving';
                 c.actionTimer = 20;
               } else {
                 const dx = this.state.entities[foodIdx].x - c.x;
                 const dy = this.state.entities[foodIdx].y - c.y;
                 const len = Math.hypot(dx, dy);
                 c.vx = (dx / len) * (c.genes.speed / 20);
                 c.vy = (dy / len) * (c.genes.speed / 20);
                 c.x += c.vx;
                 c.y += c.vy;
               }
             } else {
               c.targetId = undefined;
               c.actionTimer = 0;
             }
          }
          break;
        case 'mating':
           if (c.targetId) {
             const mate = this.state.creatures.find(m => m.id === c.targetId);
             if (mate && mate.energy > this.REPRODUCTION_COST && mate.action === 'mating') {
               const dist = Math.hypot(mate.x - c.x, mate.y - c.y);
               const reach = (c.genes.size / 10) + (mate.genes.size / 10) + 10;
               if (dist < reach) {
                 c.energy -= this.REPRODUCTION_COST;
                 mate.energy -= this.REPRODUCTION_COST;
                 c.actionTimer = 60;
                 mate.actionTimer = 60;
                 c.action = 'moving';
                 mate.action = 'moving';
                 newCreatures.push(this.reproduce(c, mate));
                 c.targetId = undefined;
                 mate.targetId = undefined;
               } else {
                 const dx = mate.x - c.x;
                 const dy = mate.y - c.y;
                 const len = Math.hypot(dx, dy);
                 c.vx = (dx / len) * (c.genes.speed / 20);
                 c.vy = (dy / len) * (c.genes.speed / 20);
                 c.x += c.vx;
                 c.y += c.vy;
               }
             } else {
               c.targetId = undefined;
               c.actionTimer = 0;
             }
           }
           break;
      }
      
      // Separation
      const cx = Math.floor(c.x / CELL_SIZE);
      const cy = Math.floor(c.y / CELL_SIZE);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighbors = grid.get(`${cx + dx},${cy + dy}`);
          if (neighbors) {
            for (const n of neighbors) {
              if (n !== c) {
                const dist = Math.hypot(n.x - c.x, n.y - c.y);
                const pushDist = (c.genes.size / 10) + (n.genes.size / 10) + 2;
                if (dist > 0 && dist < pushDist) {
                   const force = (pushDist - dist) / pushDist;
                   c.x += ((c.x - n.x) / dist) * force * 0.5;
                   c.y += ((c.y - n.y) / dist) * force * 0.5;
                }
              }
            }
          }
        }
      }

      if (c.x < 10) { c.vx = Math.abs(c.vx); c.x = 10; }
      if (c.x > this.width - 10) { c.vx = -Math.abs(c.vx); c.x = this.width - 10; }
      if (c.y < 10) { c.vy = Math.abs(c.vy); c.y = 10; }
      if (c.y > this.height - 10) { c.vy = -Math.abs(c.vy); c.y = this.height - 10; }
    }
    
    // Process deaths
    if (deadCreatureIds.size > 0) {
        this.state.creatures = this.state.creatures.filter(c => !deadCreatureIds.has(c.id));
        this.updateSpeciesStats();
    }
    
    if (newCreatures.length > 0) {
       this.state.creatures.push(...newCreatures);
       // Update global generation
       const maxGen = Math.max(...newCreatures.map(c => c.generation));
       if (maxGen > this.state.generation) this.state.generation = maxGen;
       this.updateSpeciesStats();
    }
    
    if (this.tickCount % 500 === 0) {
      this.logHistory();
    }
  }
  
  private decideAction(c: Creature) {
    if (c.energy < 40) {
      let bestDist = c.genes.vision;
      let target: Entity | undefined;
      for (const e of this.state.entities) {
        if (e.type === 'food' || e.type === 'meat') {
          const dist = Math.hypot(e.x - c.x, e.y - c.y);
          if (dist < bestDist) {
            bestDist = dist;
            target = e;
          }
        }
      }
      if (target) {
        c.action = 'eating';
        c.targetId = target.id;
        c.actionTimer = 100;
        return;
      }
    }
    
    if (c.energy > 70 && c.ageDays > this.MATURE_AGE) {
      let bestDist = c.genes.vision;
      let target: Creature | undefined;
      for (const other of this.state.creatures) {
        if (other.id !== c.id && other.species === c.species && other.energy > 70 && other.ageDays > this.MATURE_AGE && other.action !== 'mating') {
          const dist = Math.hypot(other.x - c.x, other.y - c.y);
          if (dist < bestDist) {
            bestDist = dist;
            target = other;
          }
        }
      }
      if (target) {
        c.action = 'mating';
        c.targetId = target.id;
        c.actionTimer = 200;
        target.action = 'mating';
        target.targetId = c.id;
        target.actionTimer = 200;
        return;
      }
    }
    
    if (c.energy > 90 && Math.random() < 0.2) {
      c.action = 'sleeping';
      c.actionTimer = 50 + Math.random() * 50;
      return;
    }
    
    c.action = 'moving';
    c.actionTimer = 20 + Math.random() * 40;
    const angle = Math.random() * Math.PI * 2;
    const speed = c.genes.speed / 20;
    c.vx = Math.cos(angle) * speed;
    c.vy = Math.sin(angle) * speed;
  }
  
  private reproduce(p1: Creature, p2: Creature): Creature {
    const crossover = (a: number, b: number) => (Math.random() > 0.5 ? a : b);
    const mutate = (val: number, max: number, rate: number = this.settings.mutationRate, amount: number = 0.15) => {
      if (Math.random() < rate) {
        return Math.max(1, Math.min(max, val + (Math.random() * 2 - 1) * amount * max));
      }
      return val;
    };
    
    const childGenes: Genes = {
      size: mutate(crossover(p1.genes.size, p2.genes.size), 100),
      speed: mutate(crossover(p1.genes.speed, p2.genes.speed), 100),
      vision: mutate(crossover(p1.genes.vision, p2.genes.vision), 200),
      color: p1.genes.color, 
      lifespan: mutate(crossover(p1.genes.lifespan, p2.genes.lifespan), 200),
      energyEfficiency: mutate(crossover(p1.genes.energyEfficiency, p2.genes.energyEfficiency), 100),
    };
    
    if (Math.random() < this.settings.mutationRate) {
       childGenes.color = hslToHex(Math.random() * 360, 70, 60);
    }
    
    let childSpecies = p1.species;
    let didSpeciate = false;
    
    const diff = 
      Math.abs(childGenes.size - p1.genes.size) + 
      Math.abs(childGenes.speed - p1.genes.speed) + 
      Math.abs(childGenes.vision - p1.genes.vision) +
      Math.abs(childGenes.lifespan - p1.genes.lifespan) + 
      Math.abs(childGenes.energyEfficiency - p1.genes.energyEfficiency);

    if (diff > this.settings.speciesThreshold) {
      childSpecies = generateSpeciesName();
      didSpeciate = true;
      this.state.speciesRegistry[childSpecies] = {
          name: childSpecies,
          generationDiscovered: Math.max(p1.generation, p2.generation) + 1,
          parentSpecies: p1.species,
          status: 'living',
          avgSize: childGenes.size,
          avgSpeed: childGenes.speed,
          avgLifespan: childGenes.lifespan
      };
    }

    const c: Creature = {
      id: `c_${this.nextId++}`,
      x: p1.x + (Math.random() * 20 - 10),
      y: p1.y + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      energy: 40,
      maxEnergy: 100,
      health: 100,
      maxHealth: 100,
      ageDays: 0,
      generation: Math.max(p1.generation, p2.generation) + 1,
      genes: childGenes,
      species: childSpecies,
      action: 'idle',
      actionTimer: 20,
      parents: [p1.id, p2.id],
      history: [`Born to ${p1.id} and ${p2.id} on day ${this.state.day}`]
    };
    
    if (didSpeciate) {
       this.addEvent(`New species evolved: ${childSpecies}`, 'evolution');
    }
    
    return c;
  }
  
  private spawnCreature(forceSpecies?: string) {
    let spawnX = 100 + Math.random() * (this.width - 200);
    let spawnY = 100 + Math.random() * (this.height - 200);
    
    const c: Creature = {
      id: `c_${this.nextId++}`,
      x: spawnX, y: spawnY,
      vx: 0, vy: 0,
      energy: 100, maxEnergy: 100,
      health: 100, maxHealth: 100,
      ageDays: Math.floor(Math.random() * 10), // Random starting age
      generation: 1,
      genes: {
        size: 15 + Math.random() * 10,
        speed: 30 + Math.random() * 30,
        vision: 50 + Math.random() * 50,
        color: hslToHex(Math.random() * 360, 70, 60),
        lifespan: 50 + Math.random() * 50,
        energyEfficiency: 40 + Math.random() * 30
      },
      species: forceSpecies || generateSpeciesName(),
      action: 'idle',
      actionTimer: 0,
      parents: null,
      history: [`Spawned into the world on day ${this.state.day}.`]
    };
    this.state.creatures.push(c);
  }

  public spawnEntity(type: 'food' | 'rock' | 'meat', x?: number, y?: number) {
    this.state.entities.push({
      id: `e_${this.nextEntityId++}`,
      x: x ?? (10 + Math.random() * (this.width - 20)),
      y: y ?? (10 + Math.random() * (this.height - 20)),
      type
    });
  }
  
  private triggerRandomUselessEvent() {
    const r = Math.random();
    if (r < 0.3) {
      this.state.activeUselessEffect = 'hat-day';
      this.state.effectTimer = 500;
      this.addEvent('🎩 Hat Day! All creatures temporarily have hats.', 'useless');
    } else if (r < 0.6) {
      this.state.activeUselessEffect = 'suspicious-rain';
      this.state.effectTimer = 400;
      this.addEvent('🌧️ Suspicious Rain. The rain appears to be slightly judgmental.', 'useless');
    } else {
      this.addEvent('🌱 Food Explosion!', 'useless');
      for (let i=0; i<30; i++) this.spawnEntity('food');
    }
  }

  public addEvent(msg: string, type: SimEvent['type']) {
    this.state.events.unshift({
      id: `evt_${this.nextEventId++}`,
      day: this.state.day,
      message: msg,
      type
    });
    if (this.state.events.length > 50) this.state.events.pop();
  }

  private logHistory() {
    if (this.state.creatures.length === 0) return;
    const pop = this.state.creatures.length;
    const livingSpecies = Object.values(this.state.speciesRegistry).filter(s => s.status === 'living').length;
    this.state.history.push({
      day: this.state.day,
      generation: this.state.generation,
      population: pop,
      speciesCount: livingSpecies
    });
    
    if (this.state.history.length > 200) this.state.history.shift();
  }

  private updateSpeciesStats() {
      const livingCount: Record<string, number> = {};
      const stats: Record<string, { size: number, speed: number, lifespan: number }> = {};
      
      for (const c of this.state.creatures) {
          if (!livingCount[c.species]) {
              livingCount[c.species] = 0;
              stats[c.species] = { size: 0, speed: 0, lifespan: 0 };
          }
          livingCount[c.species]++;
          stats[c.species].size += c.genes.size;
          stats[c.species].speed += c.genes.speed;
          stats[c.species].lifespan += c.genes.lifespan;
      }
      
      for (const name in this.state.speciesRegistry) {
          const s = this.state.speciesRegistry[name];
          if (livingCount[name] > 0) {
              s.status = 'living';
              s.avgSize = stats[name].size / livingCount[name];
              s.avgSpeed = stats[name].speed / livingCount[name];
              s.avgLifespan = stats[name].lifespan / livingCount[name];
          } else {
              if (s.status === 'living') {
                  s.status = 'extinct';
                  this.addEvent(`Species ${name} has gone extinct.`, 'disaster');
              }
          }
      }
  }
}
