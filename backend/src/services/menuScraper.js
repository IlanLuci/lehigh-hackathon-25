const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const RATHBONE_URL = 'https://lehigh.sodexomyway.com/en-us/locations/rathbone-dining-hall';

/**
 * Fetches menu data from Rathbone Dining Hall website
 * Note: The Sodexo website uses dynamic JavaScript to load menu items.
 * This function attempts to fetch the data, but may need API endpoint access.
 */
async function fetchRathboneMenu() {
  try {
    // 1) Try Puppeteer (most reliable for dynamic pages)
    try {
      const puppeteerItems = await fetchWithPuppeteer();
      if (puppeteerItems && puppeteerItems.length > 0) {
        return puppeteerItems;
      }
    } catch (e) {
      // Log and fall through to alternate strategies
      console.warn('Puppeteer fetch failed:', e.message);
    }

    // 2) Try known/guessed API endpoints
    try {
      const apiItems = await fetchFromSodexoAPI();
      if (apiItems && apiItems.length > 0) {
        return apiItems;
      }
    } catch (e) {
      console.warn('Sodexo API fetch failed:', e.message);
    }

    // 3) Last resort: static HTML fetch + cheerio (may fail if JS-driven)
    try {
      const response = await axios.get(RATHBONE_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      const menuItems = [];

      $('.menu-item, .food-item, [data-menu-item]').each((index, element) => {
        const $el = $(element);
        const name = $el.find('.item-name, .food-name, h3, h4').first().text().trim();
        const description = $el.find('.description, .item-description, p').first().text().trim();
        const station = $el.find('.station, .location, .category').first().text().trim();
        
        if (name) {
          menuItems.push({
            name,
            description: description || '',
            station: station || 'Main',
            category: determineCategory(name, station || ''),
            dietaryInfo: extractDietaryInfo($el),
            available: true,
            averageRating: 0,
            totalReviews: 0
          });
        }
      });

      if (menuItems.length > 0) {
        return menuItems;
      }
    } catch (e) {
      console.warn('Cheerio static fetch failed:', e.message);
    }

    // If all strategies fail, throw
    throw new Error('Rathbone menu could not be fetched by any strategy');
  } catch (error) {
    console.error('Error fetching Rathbone menu:', error.message);
    throw error;
  }
}

/**
 * Attempts to fetch menu from Sodexo's potential API endpoints
 */
async function fetchFromSodexoAPI() {
  // Sodexo sites often have an API endpoint like this:
  const possibleEndpoints = [
    'https://menus.sodexomyway.com/BiteMenu/Menu',
    'https://lehigh.sodexomyway.com/api/menu',
    'https://api.sodexomyway.com/menus/lehigh/rathbone'
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await axios.get(endpoint, {
        params: {
          locationId: 'rathbone',
          date: new Date().toISOString().split('T')[0]
        }
      });
      
      if (response.data && response.data.menu) {
        return parseAPIResponse(response.data);
      }
    } catch (error) {
      // Continue to next endpoint
      continue;
    }
  }

  return null;
}

/**
 * Parse API response from Sodexo
 */
function parseAPIResponse(data) {
  // This would need to be adjusted based on actual API structure
  const menuItems = [];
  
  if (data.menu && Array.isArray(data.menu)) {
    data.menu.forEach(item => {
      menuItems.push({
        name: item.name || item.title,
        description: item.description || '',
        station: item.station || item.location || 'Main',
        category: item.category || 'Entree',
        dietaryInfo: item.dietary || [],
        available: true,
        averageRating: 0,
        totalReviews: 0
      });
    });
  }

  return menuItems;
}

/**
 * Fetch menu using Puppeteer (headless Chromium) to render dynamic content
 */
async function fetchWithPuppeteer() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote'
    ]
  });
  try {
  let page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Block heavy resources
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Capture menu-related JSON responses
    const captured = [];
    page.on('response', async (res) => {
      try {
        const ct = (res.headers()['content-type'] || '').toLowerCase();
        const url = res.url();
        if (/(menu|menus|recipe|recipes|bite|stations|concepts)/i.test(url)) {
          let data = null;
          if (ct.includes('application/json')) {
            try { data = await res.json(); } catch (_) {}
          }
          if (!data) {
            try {
              const text = await res.text();
              try { data = JSON.parse(text); } catch (_) {}
            } catch (_) {}
          }
          if (data) {
            captured.push({ url, data });
            if (process.env.MENU_DEBUG === '1') console.log('[menu] captured JSON', url);
          }
        }
      } catch (_) { /* ignore */ }
    });

  if (process.env.MENU_DEBUG === '1') console.log('[menu] goto', RATHBONE_URL);
  await page.goto(RATHBONE_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    // Try accepting cookie consent banners if present (OneTrust, etc.)
    const cookieSelectors = [
      '#onetrust-accept-btn-handler',
      'button#onetrust-accept-btn-handler',
      'button[aria-label*="Accept" i]',
      'button:has-text("Accept All")',
      'button:has-text("I Accept")'
    ];
    for (const sel of cookieSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) { await btn.click({ delay: 20 }); break; }
      } catch (_) { /* ignore */ }
    }

    // Try to follow a direct "Menu" link if the landing page is just a location overview
    async function tryNavigateToMenuLink(page) {
      try {
        // Gather candidate anchors in page context to avoid unsupported :has-text selectors
        const menuHref = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a'));
          // Prioritize anchors that mention menu in text or href
          const candidates = anchors
            .map(a => ({
              text: (a.textContent || '').trim(),
              href: a.getAttribute('href') || ''
            }))
            .filter(a => /menu/i.test(a.text) || /menu/i.test(a.href));
          // Prefer links that include sodexomyway or BiteMenu endpoints
          const preferred = candidates.find(c => /BiteMenu|sodexomyway|menus/i.test(c.href));
          return (preferred || candidates[0])?.href || '';
        });
        if (menuHref) {
          // Resolve relative URLs in Node side
          const url = new URL(menuHref, page.url()).toString();
          if (url !== page.url()) {
            if (process.env.MENU_DEBUG === '1') console.log('[menu] navigate menu href', url);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            return true;
          }
        }
      } catch (_) { /* ignore */ }
      return false;
    }

    await tryNavigateToMenuLink(page);

    // If URL didn't change and likely still on overview, try clicking a menu button/link that opens a new tab/window
    async function tryClickMenuOpener(page) {
      try {
        const beforeUrl = page.url();
        const targetPromise = new Promise(resolve => {
          const timeout = setTimeout(() => resolve(null), 6000);
          page.browser().once('targetcreated', async (target) => {
            try {
              const newPage = await target.page();
              clearTimeout(timeout);
              resolve(newPage || null);
            } catch { resolve(null); }
          });
        });
        // Find candidate elements by text content in page context
        const clicked = await page.evaluate(() => {
          function findAndClick(tag) {
            const els = Array.from(document.querySelectorAll(tag));
            for (const el of els) {
              const txt = (el.textContent || '').trim();
              const href = el.getAttribute && el.getAttribute('href');
              if (/view menu|menu|today'?s menu/i.test(txt) || (href && /menu|BiteMenu/i.test(href))) {
                try { el.click(); return true; } catch(_) { /* noop */ }
              }
            }
            return false;
          }
          return findAndClick('a') || findAndClick('button');
        });
        if (clicked) {
          const newPage = await targetPromise;
          if (newPage) {
            try {
              await newPage.bringToFront();
              await newPage.waitForLoadState?.('domcontentloaded');
            } catch { /* ignore */ }
            if (newPage.url() !== beforeUrl) {
              if (process.env.MENU_DEBUG === '1') console.log('[menu] switched to new tab', newPage.url());
              page = newPage; // switch context
            }
          } else {
            // Maybe same tab navigation
            try { await page.waitForNavigation({ timeout: 6000, waitUntil: 'networkidle2' }); if (process.env.MENU_DEBUG === '1') console.log('[menu] same-tab navigation', page.url()); } catch { /* ignore */ }
          }
        }
      } catch (_) { /* ignore */ }
      return page;
    }

    page = await tryClickMenuOpener(page);

    // Try to wait for an element that likely indicates menu content loaded
    // We'll try multiple selectors sequentially with short timeouts
    const possibleSelectors = [
      '.menu-item',
      '.food-item',
      '[data-menu-item]',
      'section [class*="menu"] h3',
      'section [class*="menu"] h4',
      'h3:has(+ ul), h4:has(+ ul)'
    ];

    let foundSelector = null;
    for (const sel of possibleSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        foundSelector = sel;
        break;
      } catch (_) {/* try next */}
    }

    // Prefer extracting from captured JSON if available
    function debugSummarize(obj, depth = 0) {
      if (process.env.MENU_DEBUG !== '1') return;
      try {
        if (depth > 2) return;
        if (Array.isArray(obj)) {
          console.log('[menu] arr len', obj.length);
          if (obj.length > 0) debugSummarize(obj[0], depth + 1);
          return;
        }
        if (!obj || typeof obj !== 'object') { console.log('[menu] prim', typeof obj); return; }
        const keys = Object.keys(obj);
        const interesting = keys.filter(k => /(menu|Menu|day|part|period|station|Station|recipe|Recipe|item|Item|course|category|concept|group|groups|products)/.test(k));
        console.log('[menu] keys', keys.slice(0, 20));
        console.log('[menu] interesting', interesting.slice(0, 20));
        if (Array.isArray(obj.groups)) {
          const summary = obj.groups.slice(0, 10).map(g => ({
            name: (g && g.name) || '',
            products: (g && (g.products?.length || g.items?.length || g.menuItems?.length || 0))
          }));
          console.log('[menu] groups sample', summary);
        }
        for (const k of interesting.slice(0, 5)) {
          console.log('[menu] >', k);
          debugSummarize(obj[k], depth + 1);
        }
      } catch (_) { /* ignore */ }
    }
    function extractFromCaptured(capturedArr) {
      const results = [];
      const seen = new Set();

      function add(name, station, meal, description = '') {
        if (!name || typeof name !== 'string') return;
        name = name.trim();
        if (!name || /^(breakfast|brunch|lunch|dinner)$/i.test(name)) return;
        
        // Filter out condiments, single vegetables, toppings, chips, and basic ingredients
        // General patterns for common toppings and ingredients
        const nameLower = name.toLowerCase();
        const excludePatterns = [
          // Non-food items
          /have a nice day/i,
          /allergen|diet key|skip|privacy|cookie|consent|nutrition key/i,
          
          // Condiments and sauces
          /dressing|sauce|salsa|guacamole|sour cream/i,
          
          // Chips (any kind)
          /\bchips?\b(?!.*chocolate)/i, // matches "chip" or "chips" but not chocolate chips
          
          // Cheese (any kind when standalone or with simple modifiers)
          /\b(shredded|sliced|crumbled|fresh|aged)\b.*\bcheese\b/i,
          /\b(cheddar|swiss|mozzarella|feta|parmesan|provolone)\b.*\bcheese\b/i,
          /^cheese$/i,
          
          // Vegetables when standalone or with simple prep terms
          /^(shredded|sliced|diced|chopped|fresh|pickled)?\s*(lettuce|tomato|tomatoes|onion|onions|cucumber|pepper|peppers|jalapeno|cilantro|avocado|mushrooms|olives)s?$/i,
          
          // Common toppings
          /^(pickled|sliced|fresh|raw).*\b(onions?|peppers?)\b/i,
          /^(bacon|croutons|pickles)$/i,
        ];
        
        if (excludePatterns.some(pattern => pattern.test(nameLower))) return;
        if ((station || '').match(/allergen|diet key|nutrition|dressing|sauce/i)) return;
        
        const key = `${name.toLowerCase()}|${(station||'').toLowerCase()}`;
        if (seen.has(key)) return;
        const category = meal || determineCategory(name, station || '');
        results.push({
          name,
          description: (description || '').toString(),
          station: (station || '').toString() || 'Main',
          category: category || 'Entree',
          dietaryInfo: [],
          available: true,
          averageRating: 0,
          totalReviews: 0
        });
        seen.add(key);
      }

  function extractFromNode(node, ctx = {}) {
        if (!node) return;
        if (Array.isArray(node)) {
          for (const el of node) extractFromNode(el, ctx);
          return;
        }
        if (typeof node !== 'object') return;

        const keys = Object.keys(node);

        // Detect a daypart/period (meal) object
        const isMeal = (
          keys.includes('stations') || keys.includes('categories') || keys.includes('groups')
        ) && typeof node.name === 'string' && /breakfast|brunch|lunch|dinner/i.test(node.name);

        const meal = isMeal ? node.name : ctx.meal;

        // Detect a station/category object
  const hasRecipes = Array.isArray(node.recipes);
  const hasItems = Array.isArray(node.items) || Array.isArray(node.menuItems) || Array.isArray(node.dishes) || Array.isArray(node.products) || Array.isArray(node.entries) || Array.isArray(node.choices);
  const isStation = (hasRecipes || hasItems) && typeof node.name === 'string' && !/breakfast|brunch|lunch|dinner/i.test(node.name);
        const station = isStation ? node.name : ctx.station;

        // Extract from recipes/items arrays if present
        const candidateArrays = [];
        if (Array.isArray(node.recipes)) candidateArrays.push({ arr: node.recipes, type: 'recipes' });
        if (Array.isArray(node.items)) candidateArrays.push({ arr: node.items, type: 'items' });
        if (Array.isArray(node.menuItems)) candidateArrays.push({ arr: node.menuItems, type: 'menuItems' });
        if (Array.isArray(node.dishes)) candidateArrays.push({ arr: node.dishes, type: 'dishes' });
        if (Array.isArray(node.products)) candidateArrays.push({ arr: node.products, type: 'products' });
        if (Array.isArray(node.entries)) candidateArrays.push({ arr: node.entries, type: 'entries' });
        if (Array.isArray(node.choices)) candidateArrays.push({ arr: node.choices, type: 'choices' });

        for (const { arr } of candidateArrays) {
          for (const it of arr) {
            if (!it || typeof it !== 'object') continue;
            const name = it.name || it.title || it.displayName || it.display_name || it.productName || it.ProductName || it.recipeName || (it.recipe && (it.recipe.name || it.recipe.title));
            const desc = it.description || it.shortDescription || (it.recipe && (it.recipe.description || it.recipe.shortDescription)) || '';
            const st = station || it.station || it.stationName || '';
            add(name, st, meal, desc);
          }
        }

        // Avoid adding nodes solely because they have allergen/nutrition keys; rely on explicit arrays above

        // Traverse children that may contain meal/station/item structure
        const nextCtx = { meal, station };
        // If groups array present, treat each group as a station container
        if (Array.isArray(node.groups)) {
          for (const g of node.groups) {
            const gName = (g && g.name) || '';
            if (/allergen|diet key|nutrition/i.test(gName || '')) continue; // skip non-food groups
            extractFromNode(g, { meal: meal || ctx.meal, station: gName || station });
          }
        }
        // Prioritize known structural keys
        const structuralKeys = ['stations', 'categories', 'subGroups'];
        for (const k of structuralKeys) {
          if (Array.isArray(node[k]) || (node[k] && typeof node[k] === 'object')) {
            extractFromNode(node[k], nextCtx);
          }
        }
        // Fallback: walk other object keys
        for (const k of keys) {
          if (['groups', ...structuralKeys].includes(k)) continue;
          if (typeof node[k] === 'object') extractFromNode(node[k], nextCtx);
        }
      }

      // Build an index map of product-like objects by id for resolving id references
      function buildProductIndex(root) {
        const idx = new Map();
        function visit(n) {
          if (!n) return;
          if (Array.isArray(n)) { n.forEach(visit); return; }
          if (typeof n !== 'object') return;
          const id = n.id || n.productId || n.productID || n.ProductID || n.ProductId || n.RecipeID || n.recipeId;
          const name = n.display_name || n.displayName || n.productName || n.name || (n.recipe && (n.recipe.display_name || n.recipe.name));
          if ((typeof id === 'number' || typeof id === 'string') && typeof name === 'string' && name.trim()) {
            idx.set(String(id), n);
          }
          for (const k of Object.keys(n)) {
            const v = n[k];
            if (v && typeof v === 'object') visit(v);
          }
        }
        visit(root);
        return idx;
      }

      // Fast-path: Handle common Sodexo shape: array of { name, groups: [ { name, products/items/menuItems } ] }
      function attemptGroupsModel(root, index) {
        try {
          const arr = Array.isArray(root) ? root : [root];
          for (const day of arr) {
            const groups = day && Array.isArray(day.groups) ? day.groups : null;
            if (!groups) continue;
            const meal = day && typeof day.name === 'string' ? day.name : undefined;
            for (const g of groups) {
              const stationName = (g && g.name) || '';
              if (/allergen|diet key|nutrition|dressing|sauce/i.test(stationName)) continue;
              const prodArrays = [g.products, g.items, g.menuItems, g.entries, g.choices].filter(a => Array.isArray(a));
              for (const pa of prodArrays) {
                for (const it of pa) {
                  if (it && typeof it === 'object') {
                    const name = it.formalName || it.productName || it.display_name || it.displayName || it.name || (it.product && (it.product.name || it.product.display_name)) || (it.recipe && (it.recipe.name || it.recipe.display_name));
                    const desc = it.description || it.shortDescription || (it.product && (it.product.description || it.product.shortDescription)) || (it.recipe && (it.recipe.description || it.recipe.shortDescription)) || '';
                    add(name, stationName, meal || it.meal, desc);
                  } else if ((typeof it === 'number' || typeof it === 'string') && index && index.size) {
                    const ref = index.get(String(it));
                    if (ref) {
                      const name = ref.formalName || ref.display_name || ref.displayName || ref.productName || ref.name || (ref.recipe && (ref.recipe.display_name || ref.recipe.name));
                      const desc = ref.description || ref.shortDescription || (ref.recipe && (ref.recipe.description || ref.recipe.shortDescription)) || '';
                      add(name, stationName, meal || ref.meal, desc);
                    }
                  }
                }
              }
            }
          }
        } catch (e) { if (process.env.MENU_DEBUG === '1') console.log('[menu] groups model error', e.message); }
      }

      for (const entry of capturedArr) {
        try {
          // If this is a menu groups response, build index and try groups model
          if (/\/data\/menu\//i.test(entry.url)) {
            const index = buildProductIndex(entry.data);
            attemptGroupsModel(entry.data, index);
          }
          // If this looks like a product/recipe/item details response, try to push directly
          if (/(product|recipe|item|dish|menuitem)/i.test(entry.url)) {
            const node = entry.data;
            const pushDetails = (obj) => {
              if (!obj || typeof obj !== 'object') return;
              const name = obj.display_name || obj.displayName || obj.productName || obj.name || (obj.recipe && (obj.recipe.display_name || obj.recipe.name));
              const station = obj.station || obj.stationName || '';
              const meal = obj.meal || '';
              const desc = obj.description || obj.shortDescription || '';
              add(name, station, meal, desc);
            };
            if (Array.isArray(node)) {
              node.forEach(pushDetails);
            } else if (typeof node === 'object') {
              // Sometimes details are under a key like 'product' or 'recipe'
              if (node.product || node.recipe || node.item) {
                pushDetails(node.product || node.recipe || node.item);
              } else {
                pushDetails(node);
              }
            }
          }
          // Generic walk to catch any nested shapes
          extractFromNode(entry.data, {});
        } catch (e) { if (process.env.MENU_DEBUG === '1') console.log('[menu] extract error', e.message); }
      }

      return results;
    }

  if (process.env.MENU_DEBUG === '1') console.log('[menu] captured JSON count', captured.length);
  let jsonItems = extractFromCaptured(captured);
    if (process.env.MENU_DEBUG === '1') {
      for (const entry of captured.slice(0, 2)) {
        console.log('[menu] summary for', entry.url);
        debugSummarize(entry.data, 0);
      }
    }
    if (jsonItems && jsonItems.length > 0) {
      jsonItems = postProcessItems(jsonItems);
      if (jsonItems.length > 0) return jsonItems;
    }

    // Try to parse embedded JSON inside script tags on the page
    async function extractEmbeddedJSON(p) {
      try {
        const txts = await p.$$eval('script[type="application/ld+json"], script[type="application/json"], script', nodes => {
          const out = [];
          for (const n of nodes) {
            let t = n.textContent || '';
            if (!t) continue;
            if (/menu|recipe|item|station|concept/i.test(t)) out.push(t);
          }
          return out.slice(0, 20);
        });
        const results = [];
        for (const t of txts) {
          try {
            // some scripts may contain multiple JSON blocks
            const matches = t.match(/\{[\s\S]*?\}|\[[\s\S]*?\]/g) || [];
            for (const m of matches) {
              try { results.push(JSON.parse(m)); } catch { /* ignore */ }
            }
          } catch { /* ignore */ }
        }
        return results;
      } catch { return []; }
    }

    let embedded = await extractEmbeddedJSON(page);
    if (embedded && embedded.length) {
      let fromEmb = extractFromCaptured(embedded.map(d => ({ url: 'embedded', data: d })));
      fromEmb = postProcessItems(fromEmb);
      if (fromEmb.length > 0) return fromEmb;
    }

    // Strategy: Use station names from captured JSON to target DOM sections
    try {
      const stationNames = [];
      for (const entry of captured) {
        const root = entry.data;
        const arr = Array.isArray(root) ? root : [root];
        for (const day of arr) {
          const groups = day && Array.isArray(day.groups) ? day.groups : [];
          for (const g of groups) {
            if (g && typeof g.name === 'string' && !/allergen|diet key|nutrition/i.test(g.name)) {
              stationNames.push(g.name);
            }
          }
        }
      }
      if (stationNames.length) {
        const stationItems = await page.evaluate((stations) => {
          function norm(s){return (s||'').toLowerCase().replace(/\s+/g,' ').trim();}
          function isExcludedText(t){return /manage consent|privacy|allergen|diet key|nutrition key|hours|today/i.test(t||'');}
          const out = [];
          const set = new Set(stations.map(norm));
          const headings = Array.from(document.querySelectorAll('h2, h3, h4, [role="heading"]'));
          headings.forEach(h => {
            const ht = norm(h.textContent||'');
            if (!set.has(ht)) return;
            // Walk siblings under this heading until next heading of same level
            let node = h.nextElementSibling;
            let hops = 0;
            while (node && hops < 80) {
              if (/^H[23-4]$/.test(node.tagName)) break;
              const els = node.querySelectorAll ? node.querySelectorAll('li, a, p, .menu-item, .food-item') : [];
              els.forEach(el => {
                const text = (el.textContent||'').replace(/\s+/g,' ').trim();
                if (text && text.length>1 && !isExcludedText(text)) {
                  out.push({
                    name: text,
                    description: '',
                    station: h.textContent.trim(),
                    category: 'Entree',
                    dietaryInfo: [],
                    available: true,
                    averageRating: 0,
                    totalReviews: 0
                  });
                }
              });
              node = node.nextElementSibling; hops++;
            }
          });
          // de-dupe
          const seen = new Set();
          return out.filter(i=>{const k=(i.name+"|"+i.station).toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true;});
        }, stationNames);
        const filteredStations = (stationItems||[]).filter(i=>i.name && !/allergen|diet key|nutrition key/i.test(i.name));
        if (filteredStations.length>0) return filteredStations.slice(0,300);
      }
    } catch { /* ignore */ }

    // Strategy: Wait for the specific 'Rathbone Dining Hall Menu' section and parse items there
    try {
      await page.waitForFunction(() => {
        const hs = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'));
        return !!hs.find(h => /rathbone\s+dining\s+hall\s+menu/i.test(h.textContent || ''));
      }, { timeout: 12000 });

  const sectionItems = await page.evaluate(() => {
        function getNearestStation(el) {
          let node = el;
          while (node && node !== document.body) {
            let prev = node.previousElementSibling;
            while (prev) {
              if (/^H[12-6]$/.test(prev.tagName) && prev.textContent.trim().length > 0) {
                return prev.textContent.trim();
              }
              prev = prev.previousElementSibling;
            }
            node = node.parentElement;
          }
          return '';
        }
        function determineCategoryJS(name, station) {
          const nl = (name || '').toLowerCase();
          const sl = (station || '').toLowerCase();
          if (nl.includes('salad') || sl.includes('salad')) return 'Salad';
          if (nl.includes('pizza') || sl.includes('pizza')) return 'Pizza';
          if (nl.includes('pasta') || sl.includes('pasta')) return 'Pasta';
          if (nl.includes('soup') || sl.includes('soup')) return 'Soup';
          if (nl.includes('sandwich') || nl.includes('burger')) return 'Sandwich';
          if (nl.includes('dessert') || nl.includes('cookie') || nl.includes('cake')) return 'Dessert';
          if (nl.includes('breakfast') || nl.includes('eggs') || nl.includes('pancake')) return 'Breakfast';
          return 'Entree';
        }
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'));
        const main = headings.find(h => /rathbone\s+dining\s+hall\s+menu/i.test(h.textContent || ''));
        if (!main) return [];
        const out = [];
        const seen = new Set();
        function isInExcludedSection(el) {
          const sel = '[id*="nutrition" i], [class*="nutrition" i], [id*="allergen" i], [class*="allergen" i]';
          return !!(el && (el.closest && el.closest(sel)));
        }
        function pushItem(name, stationGuess, elForContext) {
          if (!name) return;
          name = name.replace(/\s+/g, ' ').trim();
          if (!name || name.length < 2) return;
          const skip = /^(breakfast|brunch|lunch|dinner|today|hours|menu)$/i;
          if (skip.test(name)) return;
          if (/manage consent|privacy|strictly necessary|vendors list/i.test(name)) return;
          if (elForContext && isInExcludedSection(elForContext)) return;
          const key = name.toLowerCase();
          if (seen.has(key)) return;
          const station = stationGuess || getNearestStation(main);
          out.push({
            name,
            description: '',
            station: station || 'Main',
            category: determineCategoryJS(name, station),
            dietaryInfo: [],
            available: true,
            averageRating: 0,
            totalReviews: 0
          });
          seen.add(key);
        }
        // Find a section container near main heading
        let section = main.closest('section') || main.parentElement || document.body;
        let node = section === main ? main.nextElementSibling : section.firstElementChild;
        let hops = 0;
        let currentStation = '';
        while (node && hops < 200) {
          const tag = node.tagName || '';
          const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
          if (/^H[12-6]$/.test(tag)) {
            const t = text.toLowerCase();
            if (!/rathbone\s+dining\s+hall\s+menu/.test(t)) {
              currentStation = text; // sub-heading acts as station/meal
            }
          }
          const selectors = 'li, .menu-item, .food-item, [data-menu-item], a, p';
          const els = node.querySelectorAll ? node.querySelectorAll(selectors) : [];
          if (els && els.length) {
            els.forEach(el => {
              let t = (el.textContent || '').replace(/\s+/g, ' ').trim();
              if (t && t.length > 1) pushItem(t, currentStation || getNearestStation(el), el);
            });
          } else if (text && text.length > 1 && !/^H[12-6]$/.test(tag)) {
            pushItem(text, currentStation || getNearestStation(node), node);
          }
          node = node.nextElementSibling;
          hops++;
        }
        return out;
      });

      const filteredSection = (sectionItems || []).filter(i => i && i.name && !/manage consent|privacy|allergen|diet key|skip|cookie|nutrition key/i.test(i.name));
      if (filteredSection.length > 0) {
        return filteredSection.slice(0, 300);
      }
    } catch (_) { /* ignore and fallback */ }

  // Extract items in the page context (DOM)
  const items = await page.evaluate(() => {
      function getNearestStation(el) {
        // Walk up to find a section heading that looks like a station name
        let node = el;
        while (node && node !== document.body) {
          // Check previous siblings for headings
          let prev = node.previousElementSibling;
          while (prev) {
            if (/^H[12-4]$/.test(prev.tagName) && prev.textContent.trim().length > 0) {
              return prev.textContent.trim();
            }
            prev = prev.previousElementSibling;
          }
          // Move up
          node = node.parentElement;
        }
        return '';
      }

      function determineCategoryJS(name, station) {
        const nl = (name || '').toLowerCase();
        const sl = (station || '').toLowerCase();
        if (nl.includes('salad') || sl.includes('salad')) return 'Salad';
        if (nl.includes('pizza') || sl.includes('pizza')) return 'Pizza';
        if (nl.includes('pasta') || sl.includes('pasta')) return 'Pasta';
        if (nl.includes('soup') || sl.includes('soup')) return 'Soup';
        if (nl.includes('sandwich') || nl.includes('burger')) return 'Sandwich';
        if (nl.includes('dessert') || nl.includes('cookie') || nl.includes('cake')) return 'Dessert';
        if (nl.includes('breakfast') || nl.includes('eggs') || nl.includes('pancake')) return 'Breakfast';
        return 'Entree';
      }

      const out = [];
      const seen = new Set();

      function isInExcludedSection(el) {
        const sel = '[id*="nutrition" i], [class*="nutrition" i], [id*="allergen" i], [class*="allergen" i]';
        return !!(el && (el.closest && el.closest(sel)));
      }
      function pushItem(name, stationGuess, elForContext) {
        if (!name) return;
        name = name.replace(/\s+/g, ' ').trim();
        if (!name || name.length < 2) return;
        const skipPhrases = /manage consent|privacy preference|strictly necessary|audience measurement|functional|targeting|vendors list|rathbone dining hall menu|breakfast|brunch|lunch|dinner|today|hours|map|calories|nutrition/i;
        if (skipPhrases.test(name)) return;
        if (elForContext && isInExcludedSection(elForContext)) return;
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        const station = stationGuess || '';
        const category = determineCategoryJS(name, station);
        out.push({
          name,
          description: '',
          station: station || 'Main',
          category,
          dietaryInfo: [],
          available: true,
          averageRating: 0,
          totalReviews: 0
        });
        seen.add(key);
      }

      // Strategy A: Collect explicit menu item containers
      const containers = Array.from(document.querySelectorAll('.menu-item, .food-item, [data-menu-item]'));
      containers.forEach(el => {
        const nameEl = el.querySelector('.item-name, .food-name, h3, h4, .name');
        const name = nameEl ? nameEl.textContent : el.textContent;
        pushItem(name, getNearestStation(el), el);
      });

      // Strategy B: Under meal headings, collect list items
      const mealHeadings = Array.from(document.querySelectorAll('h3, h4')).filter(h => /breakfast|brunch|lunch|dinner/i.test(h.textContent || ''));
      mealHeadings.forEach(h => {
        let node = h.nextElementSibling;
        let hops = 0;
        while (node && hops < 40) {
          if (/^H[34]$/.test(node.tagName)) break; // next section
          // Look for lists and entries
          const lis = node.querySelectorAll ? node.querySelectorAll('li, .menu-item, .food-item, [data-menu-item], a, p') : [];
          if (lis && lis.length) {
            lis.forEach(el => {
              let text = el.textContent || '';
              text = text.replace(/\s+/g, ' ').trim();
              if (text.length > 1) pushItem(text, h.textContent.trim(), el);
            });
          } else {
            const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
            if (text && text.length > 1) pushItem(text, h.textContent.trim(), node);
          }
          node = node.nextElementSibling;
          hops++;
        }
      });

      return out;
    });

    // Deduplicate and filter obviously wrong items
    let clean = (items || [])
      .filter(i => i.name && i.name.length >= 2 && !/manage consent|privacy/i.test(i.name))
      .filter(i => !/^(breakfast|brunch|lunch|dinner)$/i.test(i.name.trim()))
      .filter(i => !/allergen|diet key|skip|nutrition key/i.test(i.name))
      .slice(0, 300);

    // If main page yielded too few items, attempt scraping iframes (menus often load inside iframes)
    if (!clean || clean.length < 3) {
      const frameResults = [];
      const frames = page.frames();
      for (const fr of frames) {
        try {
          const fItems = await fr.evaluate(() => {
            function getNearestStation(el) {
              let node = el;
              while (node && node !== document.body) {
                let prev = node.previousElementSibling;
                while (prev) {
                  if (/^H[12-4]$/.test(prev.tagName) && prev.textContent.trim().length > 0) {
                    return prev.textContent.trim();
                  }
                  prev = prev.previousElementSibling;
                }
                node = node.parentElement;
              }
              return '';
            }
            function determineCategoryJS(name, station) {
              const nl = (name || '').toLowerCase();
              const sl = (station || '').toLowerCase();
              if (nl.includes('salad') || sl.includes('salad')) return 'Salad';
              if (nl.includes('pizza') || sl.includes('pizza')) return 'Pizza';
              if (nl.includes('pasta') || sl.includes('pasta')) return 'Pasta';
              if (nl.includes('soup') || sl.includes('soup')) return 'Soup';
              if (nl.includes('sandwich') || nl.includes('burger')) return 'Sandwich';
              if (nl.includes('dessert') || nl.includes('cookie') || nl.includes('cake')) return 'Dessert';
              if (nl.includes('breakfast') || nl.includes('eggs') || nl.includes('pancake')) return 'Breakfast';
              return 'Entree';
            }
            const out = [];
            const seen = new Set();
            function pushItem(name, stationGuess) {
              if (!name) return;
              name = name.replace(/\s+/g, ' ').trim();
              if (!name || name.length < 2) return;
              const skipPhrases = /manage consent|privacy preference|strictly necessary|audience measurement|functional|targeting|vendors list|rathbone dining hall menu|breakfast|brunch|lunch|dinner|today|hours|map|calories|nutrition/i;
              if (skipPhrases.test(name)) return;
              const key = name.toLowerCase();
              if (seen.has(key)) return;
              const station = stationGuess || '';
              const category = determineCategoryJS(name, station);
              out.push({
                name,
                description: '',
                station: station || 'Main',
                category,
                dietaryInfo: [],
                available: true,
                averageRating: 0,
                totalReviews: 0
              });
              seen.add(key);
            }
            const containers = Array.from(document.querySelectorAll('.menu-item, .food-item, [data-menu-item]'));
            containers.forEach(el => {
              const nameEl = el.querySelector('.item-name, .food-name, h3, h4, .name');
              const name = nameEl ? nameEl.textContent : el.textContent;
              pushItem(name, getNearestStation(el));
            });
            const mealHeadings = Array.from(document.querySelectorAll('h3, h4')).filter(h => /breakfast|brunch|lunch|dinner/i.test(h.textContent || ''));
            mealHeadings.forEach(h => {
              let node = h.nextElementSibling, hops = 0;
              while (node && hops < 40) {
                if (/^H[34]$/.test(node.tagName)) break;
                const lis = node.querySelectorAll ? node.querySelectorAll('li, .menu-item, .food-item, [data-menu-item], a, p') : [];
                if (lis && lis.length) {
                  lis.forEach(el => {
                    let text = el.textContent || '';
                    text = text.replace(/\s+/g, ' ').trim();
                    if (text.length > 1) pushItem(text, h.textContent.trim());
                  });
                } else {
                  const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
                  if (text && text.length > 1) pushItem(text, h.textContent.trim());
                }
                node = node.nextElementSibling; hops++;
              }
            });
            return out;
          });
          if (Array.isArray(fItems) && fItems.length) {
            for (const it of fItems) {
              if (it && it.name && !/^(breakfast|brunch|lunch|dinner)$/i.test(it.name.trim())) {
                frameResults.push(it);
              }
            }
          }
        } catch (_) { /* ignore frame errors */ }
      }
      if (frameResults.length > 0) {
        clean = frameResults
          .filter(i => i.name && i.name.length >= 2 && !/manage consent|privacy/i.test(i.name))
          .filter(i => !/allergen|diet key|skip|nutrition key/i.test(i.name))
          .slice(0, 300);
      }
    }

    if (!clean || clean.length === 0) {
      throw new Error('Puppeteer extracted 0 items');
    }
    return clean;
  } finally {
    await browser.close();
  }
}

// Post-process items: dedupe and normalize
function postProcessItems(items) {
  const seen = new Set();
  const out = [];
  for (const i of items) {
    if (!i || !i.name) continue;
    const nm = i.name.toString().trim();
    if (!nm || /manage consent|privacy preference|vendors list|allergen|diet key|nutrition key/i.test(nm)) continue;
    const key = nm.toLowerCase();
    if (seen.has(key)) continue;
    const station = (i.station || '').toString();
    out.push({
      name: nm,
      description: (i.description || '').toString(),
      station: station || 'Main',
      category: determineCategory(nm, station),
      dietaryInfo: Array.isArray(i.dietaryInfo) ? i.dietaryInfo : [],
      available: true,
      averageRating: 0,
      totalReviews: 0
    });
    seen.add(key);
  }
  return out;
}

/**
 * Determine category based on name and station
 */
function determineCategory(name, station) {
  const nameLower = name.toLowerCase();
  const stationLower = station.toLowerCase();

  if (stationLower === 'bliss') return 'Dessert';
  if (nameLower.includes('salad') || stationLower.includes('salad')) return 'Salad';
  if (nameLower.includes('pizza') || stationLower.includes('pizza')) return 'Pizza';
  if (nameLower.includes('pasta') || stationLower.includes('pasta')) return 'Pasta';
  if (nameLower.includes('soup') || stationLower.includes('soup')) return 'Soup';
  if (nameLower.includes('sandwich') || nameLower.includes('burger')) return 'Sandwich';
  if (nameLower.includes('dessert') || nameLower.includes('cookie') || nameLower.includes('cake')) return 'Dessert';
  if (nameLower.includes('breakfast') || nameLower.includes('eggs') || nameLower.includes('pancake')) return 'Breakfast';

  return 'Entree';
}

/**
 * Extract dietary information from element
 */
function extractDietaryInfo($el) {
  const dietaryInfo = [];
  const icons = $el.find('[data-dietary], .dietary-icon, .diet-icon').toArray();
  
  icons.forEach(icon => {
    const $icon = cheerio.load(icon);
    const alt = $icon('img').attr('alt') || '';
    const title = $icon.attr('title') || '';
    const text = alt || title;
    
    if (text.toLowerCase().includes('vegetarian')) dietaryInfo.push('Vegetarian');
    if (text.toLowerCase().includes('vegan')) dietaryInfo.push('Vegan');
    if (text.toLowerCase().includes('gluten')) dietaryInfo.push('Gluten-Free');
    if (text.toLowerCase().includes('dairy')) dietaryInfo.push('Dairy-Free');
  });

  return [...new Set(dietaryInfo)]; // Remove duplicates
}

/**
 * Sample Rathbone menu data (used as fallback)
 */
// Note: Removed sample menu fallback per requirement

module.exports = {
  fetchRathboneMenu,
  fetchFromSodexoAPI,
  // No sample fallback exported
};
