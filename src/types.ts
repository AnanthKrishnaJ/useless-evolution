export interface Genes {
  size: number;
  speed: number;
  vision: number;
  color: string;
  lifespan: number;
  energyEfficiency: number;
}

export interface Creature {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  ageDays: number;
  generation: number;
  species: string;
  genes: Genes;
  action: 'idle' | 'moving' | 'eating' | 'sleeping' | 'mating' | 'dead' | 'dancing' | 'attacking_rock' | 'isDying';
  actionTimer: number;
  targetId?: string;
  parents: [string, string] | null;
  history: string[];
}

export interface SpeciesRecord {
  name: string;
  generationDiscovered: number;
  parentSpecies: string | null;
  status: 'living' | 'extinct';
  avgSize: number;
  avgSpeed: number;
  avgLifespan: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  type: 'food' | 'rock' | 'meat' | 'death_anim';
  timer?: number;
  color?: string;
}

export interface SimEvent {
  id: string;
  day: number;
  message: string;
  type: 'normal' | 'disaster' | 'useless' | 'evolution' | 'achievement';
}

export interface HistoryPoint {
  day: number;
  generation: number;
  population: number;
  speciesCount: number;
}

export interface WorldState {
  creatures: Creature[];
  entities: Entity[];
  day: number;
  generation: number;
  events: SimEvent[];
  history: HistoryPoint[];
  speciesRegistry: Record<string, SpeciesRecord>;
  activeUselessEffect: 'none' | 'hat-day' | 'suspicious-rain' | 'dance-party' | 'gravity';
  effectTimer: number;
}

export interface SimulationSettings {
  startingPopulation: number;
  mutationRate: number;
  speciesThreshold: number;
  foodAbundance: number;
  randomEvents: boolean;
}
