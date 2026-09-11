const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/import { SimulationEngine } from "\.\/simulation\/Engine";import { SpeciesRecord } from "\.\/types"; from '\.\/simulation\/Engine';/, "import { SimulationEngine } from './simulation/Engine';\nimport { SpeciesRecord } from './types';");
fs.writeFileSync('src/App.tsx', code);
