import fs from 'fs';
let code = fs.readFileSync('src/simulation/Engine.ts', 'utf8');
code = code.replace(
  /if \(existingState && existingState\.state\) \{/,
  `if (existingState && existingState.state) {
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
`
);
fs.writeFileSync('src/simulation/Engine.ts', code);
