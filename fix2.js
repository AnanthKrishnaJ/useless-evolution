import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.split('\n').filter(line => !line.includes('import { SimulationEngine }') && !line.includes('import { SpeciesRecord }') && !line.includes('import { useEffect, useRef, useState }')).join('\n');
code = `import { useEffect, useRef, useState } from 'react';
import { SimulationEngine } from './simulation/Engine';
import { SpeciesRecord } from './types';
` + code;
fs.writeFileSync('src/App.tsx', code);
