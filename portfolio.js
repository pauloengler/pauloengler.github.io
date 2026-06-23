const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVn3Mw1D4qw9pc_ifibalqvnFv3rEf1xQ8eFNvXNY_t8UyH1c8_MkfTG8KkrczCnsyYaQo4lW2O0E3/pub?output=csv';
const SETTINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVn3Mw1D4qw9pc_ifibalqvnFv3rEf1xQ8eFNvXNY_t8UyH1c8_MkfTG8KkrczCnsyYaQo4lW2O0E3/pub?gid=843736092&single=true&output=csv';
const CHAPTER_ORDER = ['Activations', 'Campaigns', 'Print & Design', 'Other'];

function parseLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQ) { inQ = true; }
    else if (ch === '"' && inQ) { inQ = false; }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

function parseCSV(text, filterKey) {
  const lines = text.trim().replace(/\r/g, '').split('\n');
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1).map(line => {
    const cols = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
    return obj;
  }).filter(r => filterKey ? r[filterKey] : Object.values(r).some(v => v));
}

async function loadSettings() {
  if (!SETTINGS_URL) return;
  try {
    const res = await fetch(SETTINGS_URL);
    const text = await res.text();
    const rows = parseCSV(text, 'key');
    const settings = {};
    rows.forEach(r => { if (r.key) settings[r.key.trim()] = r.value; });
    if (settings.subline) document.getElementById('hero-subline').textContent = settings.subline;
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

async function loadProjects() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const projects = parseCSV(text, 'name');
    renderProjects(projects);
  } catch (err) {
    document.getElementById('main-content').innerHTML = '<div class="projects-grid"><p class="loading">Could not load projects.</p></div>';
  }
}

function renderProjects(projects) {
  const chapters = {};
  CHAPTER_ORDER.forEach(ch => { chapters[ch] = []; });
  projects.forEach(p => {
    const ch = p.chapter || 'Other';
    if (!chapters[ch]) chapters[ch] = [];
    chapters[ch].push(p);
  });

  const main = document.getElementById('main-content');
  main.innerHTML = '';

  CHAPTER_ORDER.forEach(chapterName => {
    const items = chapters[chapterName];
    if (!items || items.length === 0) return;

    const header = document.createElement('div');
    header.className = 'chapter-header';
    header.innerHTML = '<span class="chapter-label">' + chapterName + '</span>';
    main.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'projects-grid';
    items.forEach(p => grid.appendChild(buildCard(p)));
    main.appendChild(grid);
  });

  requestAnimationFrame(function() {
    requestAnimationFrame(equaliseAwardHeights);
  });
}

function equaliseAwardHeights() {
  document.querySelectorAll('.projects-grid').forEach(function(grid) {
    const awardDivs = Array.from(grid.querySelectorAll('.award-icons, .award-spacer'));
    if (!awardDivs.length) return;
    awardDivs.forEach(function(el) { el.style.height = ''; });
    const rows = {};
    awardDivs.forEach(function(el) {
      const key = Math.round(el.getBoundingClientRect().top);
      if (!rows[key]) rows[key] = [];
      rows[key].push(el);
    });
    Object.values(rows).forEach(function(row) {
      const maxH = Math.max.apply(null, row.map(function(el) { return el.scrollHeight; }));
      row.forEach(function(el) { el.style.height = maxH + 'px'; });
    });
  });
}

window.addEventListener('resize', equaliseAwardHeights);

function buildCard(p) {
  const a = document.createElement('a');
  a.className = 'project-card';
  a.href = 'project.html?id=' + (p.slug || slugify(p.name));

  const awardSlots = [];
  for (let i = 1; i <= 12; i++) {
    const file = (p['award' + i] || '').trim();
    const count = parseInt(p['award' + i + 'count']) || 1;
    if (file) awardSlots.push({ file: file, count: count });
  }

  let iconsHTML;
  if (awardSlots.length) {
    const slotsHTML = awardSlots.map(function(slot) {
      let imgs = '';
      for (let j = 0; j < slot.count; j++) {
        imgs += '<img src="icons/' + slot.file + '" alt="' + slot.file.replace(/\.\w+$/, '') + '">';
      }
      return '<div class="award-slot">' + imgs + '</div>';
    }).join('');
    iconsHTML = '<div class="award-icons">' + slotsHTML + '</div>';
  } else {
    iconsHTML = '<div class="award-spacer"></div>';
  }

  let thumbInner = '';
  if (p.thumbnail) {
    const isVideo = p.thumbnail.toLowerCase().endsWith('.mp4');
    if (isVideo) {
      thumbInner = '<video src="thumbnail/' + p.thumbnail + '" autoplay loop muted playsinline></video>';
    } else {
      thumbInner = '<img src="thumbnail/' + p.thumbnail + '" alt="' + p.name + '" loading="lazy">';
    }
  }

  const descHTML = p.description ? '<p class="project-desc">' + p.description + '</p>' : '';

  a.innerHTML = iconsHTML +
    '<div class="project-thumb">' + thumbInner + '</div>' +
    '<div class="project-info">' +
      '<div class="project-info-top">' +
        '<div class="project-meta">' +
          '<p class="project-client">' + (p.client || '') + '</p>' +
          '<p class="project-name">' + p.name + '</p>' +
        '</div>' +
        '<span class="btn-view">View Project</span>' +
      '</div>' +
      descHTML +
    '</div>';

  return a;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

loadSettings();
loadProjects();
