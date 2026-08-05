import fs from 'fs';
import path from 'path';

const files = [
  'app/brasil/page.tsx', 
  'app/internacional/page.tsx', 
  'app/cripto/page.tsx', 
  'app/page.tsx',
  'components/PortfolioDashboard.tsx'
];

files.forEach(f => {
  const fileRoute = path.join(process.cwd(), f);
  if (fs.existsSync(fileRoute)) {
    let content = fs.readFileSync(fileRoute, 'utf-8');
    
    // Cards
    content = content.replace(/bg-\[#0D1117\] border border-\[#30363D\] rounded-md p-5/g, 'glass-panel p-5');
    content = content.replace(/glass-panel p-5 relative overflow-hidden group hover:border-\[[^\]]+\]\/30 transition-all shadow-sm/g, 'glass-panel glass-panel-hover overflow-hidden group relative p-6');
    
    // Sections (Tables etc)
    content = content.replace(/bg-\[#0D1117\] border border-\[#30363D\] rounded-md overflow-hidden shadow-sm/g, 'glass-panel overflow-hidden');
    
    // Modals
    content = content.replace(/bg-\[#0D1117\] border border-\[#30363D\] rounded-lg/g, 'glass-panel rounded-2xl');
    
    // Tooltips
    content = content.replace(/bg-\[#0D1117\] border border-\[#30363D\] p-3 rounded-md shadow-lg/g, 'glass-panel p-3 shadow-xl');
    
    // Inputs (that are not replaced yet)
    content = content.replace(/bg-\[#0D1117\] border border-\[#30363D\]( focus:border-[#3b82f6])?/g, 'bg-white/[0.03] border border-white/10 focus:border-brand-accent shadow-inner');
    
    // Modal headers bg
    content = content.replace(/bg-\[#161B22\]\/60/g, 'bg-white/[0.02]');
    
    // Section headers bg
    content = content.replace(/bg-\[#161B22\]\/40/g, 'bg-white/[0.02]');

    // Buttons
    content = content.replace(/bg-\[#21262d\] hover:bg-\[#30363d\] text-\[#c9d1d9\] border border-\[#30363D\]([\s\S]*?)text-xs font-semibold rounded px-3 py-1.5 transition-all/g, 'btn-primary text-xs');
    
    // Default Cancel buttons
    content = content.replace(/border border-\[#30363D\] bg-\[#21262d\] hover:bg-\[#30363d\] text-\[#c9d1d9\] text-xs font-bold rounded-md px-4 py-2 transition-all/g, 'btn-primary text-xs');

    // Default Save buttons
    content = content.replace(/bg-\[#1f6feb\] hover:bg-\[#388bfd\] text-white text-xs font-bold rounded-md px-4 py-2 transition-all/g, 'btn-accent text-xs');

    // Title h1
    content = content.replace(/text-2xl font-bold tracking-tight text-\[#E6EDF3\]/g, 'text-3xl font-bold heading-display mb-1');
    
    // Metrics
    content = content.replace(/text-3xl font-bold tracking-tight text-\[#E6EDF3\]/g, 'text-4xl font-bold heading-display mb-1');
    
    // Text colors
    content = content.replace(/text-\[#E6EDF3\]/g, 'text-white');
    content = content.replace(/text-\[#8B949E\]/g, 'text-white/50');
    content = content.replace(/text-\[#c9d1d9\]/g, 'text-white/80');

    // Borders
    content = content.replace(/border-\[#30363D\]/g, 'border-white/10');
    content = content.replace(/divide-\[#30363D\](\/60)?/g, 'divide-white/10');
    
    // Tbody hover
    content = content.replace(/hover:bg-\[#161B22\]\/20/g, 'hover:bg-white/[0.02]');

    // Action buttons in tables
    content = content.replace(/hover:bg-\[#30363d\](\/60)?/g, 'hover:bg-white/10');
    content = content.replace(/hover:bg-\[#da3633\]\/10/g, 'hover:bg-red-500/10');
    content = content.replace(/text-\[#f85149\]/g, 'text-red-400');

    // Colors
    content = content.replace(/bg-blue-600/g, 'bg-brand-accent');
    content = content.replace(/text-\[#58a6ff\]/g, 'text-brand-accent');
    content = content.replace(/text-\[#388bfd\]/g, 'text-brand-accent');

    // Chart grid
    content = content.replace(/stroke="#30363D"/g, 'stroke="rgba(255,255,255,0.1)"');
    content = content.replace(/stroke="#8B949E"/g, 'stroke="rgba(255,255,255,0.3)"');
    content = content.replace(/fill: '#8B949E'/g, "fill: 'rgba(255,255,255,0.4)'");

    fs.writeFileSync(fileRoute, content, 'utf-8');
    console.log('Processed', f);
  }
});
