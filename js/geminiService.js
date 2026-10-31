// geminiService.js - Featherless AI Service for AI Space Teacher NPC (Professor Spike)
// Powered by open-source high-speed models via Featherless API (OpenAI-compatible)

export class FeatherlessAIService {
  constructor() {
    this.storageKey = 'exoplanet_featherless_api_key';
    this.apiKey = this.loadApiKey();
    this.model = 'Qwen/Qwen2.5-7B-Instruct';
    this.apiEndpoint = 'https://api.featherless.ai/v1/chat/completions';
  }

  loadApiKey() {
    // 1. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get('featherlessKey') || urlParams.get('geminiKey') || urlParams.get('apiKey');
    if (paramKey) {
      localStorage.setItem(this.storageKey, paramKey.trim());
      return paramKey.trim();
    }

    // 2. Check localStorage
    const saved = localStorage.getItem(this.storageKey);
    if (saved && saved.trim().length > 5) {
      return saved.trim();
    }

    return '';
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    if (this.apiKey) {
      localStorage.setItem(this.storageKey, this.apiKey);
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Generates Teacher comparison dialogue when landing on a new exoplanet.
   * Compares CURRENT planet with PREVIOUS planet and Earth.
   */
  /**
   * Generates an in-depth Human Compatibility Briefing comparing visited planet against previous planet.
   * Delivers a rich dashboard-like comparison table and child-friendly ELI5 advice.
   */
  async generateHumanCompatibilityComparison(currentPlanet, previousPlanet) {
    const isPrevEarth = !previousPlanet || previousPlanet.pl_name === 'Earth' || previousPlanet.isEarth;
    const isCurrentEarth = currentPlanet.pl_name === 'Earth' || currentPlanet.isEarth;

    const prevInfo = {
      name: isPrevEarth ? 'Earth' : (previousPlanet.pl_name || 'Previous World'),
      gravity: previousPlanet ? (previousPlanet.surfaceGravity || 1.0) : 1.0,
      density: previousPlanet ? (previousPlanet.pl_dens || 5.51) : 5.51,
      temperatureK: previousPlanet ? (previousPlanet.pl_eqt || 288) : 288,
      type: previousPlanet ? (previousPlanet.planetType || 'Terrestrial') : 'Terrestrial (Home World)',
      isEarth: isPrevEarth,
      isLiquidWorld: Boolean(previousPlanet && previousPlanet.isLiquidWorld)
    };

    const currentInfo = {
      name: isCurrentEarth ? 'Earth' : (currentPlanet.pl_name || 'Destination World'),
      radius: currentPlanet.pl_rade || 1.0,
      mass: currentPlanet.pl_bmasse || 1.0,
      gravity: currentPlanet.surfaceGravity || 1.0,
      density: currentPlanet.pl_dens || 5.51,
      temperatureK: currentPlanet.pl_eqt || 288,
      insolation: currentPlanet.pl_insol || 1.0,
      type: currentPlanet.planetType || 'Terrestrial',
      isLiquidWorld: Boolean(currentPlanet.isLiquidWorld),
      isGoldilocks: Boolean(currentPlanet.isGoldilocks),
      isEarth: isCurrentEarth
    };

    const dashboard = this.generateCompatibilityDashboardData(currentInfo, prevInfo);

    if (this.hasApiKey() && !isCurrentEarth) {
      const systemInstruction = `You are Professor Spike, a fluffy space dog mentor giving a 5-year-old cadet named Tom one cheerful 2-sentence tip about exploring ${currentInfo.name}. Use simple words, say whether it is bouncy or cold or warm, and remind them to keep their space helmet safe!`;
      try {
        const aiTip = await this.callFeatherlessAPI(systemInstruction, `Planet: ${currentInfo.name}, Gravity: ${currentInfo.gravity}g, Temp: ${currentInfo.temperatureK} K`);
        if (aiTip) {
          const customizedHtml = dashboard.html.replace(
            /<strong>Professor Spike's Cadet Rule:<\/strong>.*?<\/div>/s,
            `<strong>Professor Spike's Cadet Rule:</strong> ${aiTip}</div>`
          );
          return {
            text: dashboard.text,
            dashboardHtml: customizedHtml,
            source: 'featherless'
          };
        }
      } catch (err) {
        console.warn('[FeatherlessService] AI tip failed, using offline dashboard:', err);
      }
    }

    return {
      text: dashboard.text,
      dashboardHtml: dashboard.html,
      source: 'offline'
    };
  }

  /**
   * Generates structured Planetary Compatibility Dashboard Table data and matching text summary.
   */
  generateCompatibilityDashboardData(current, prev) {
    const isPrevEarth = !prev || prev.isEarth || prev.name === 'Earth';
    const isCurrentEarth = current.isEarth || current.name === 'Earth';

    const curName = isCurrentEarth ? 'Earth' : (current.name || 'Destination World');
    const curGrav = Number(current.gravity || 1.0).toFixed(2);
    const curEqt = current.temperatureK || 288;
    const curC = (curEqt - 273.15).toFixed(0);
    const curDens = Number(current.density || 5.5).toFixed(2);
    const isLiquid = Boolean(current.isLiquidWorld);
    const isGoldilocks = Boolean(current.isGoldilocks);

    const prevName = isPrevEarth ? 'Earth' : (prev.name || 'Previous Exoplanet');
    const prevGrav = Number(prev.gravity || 1.0).toFixed(2);
    const prevEqt = prev.temperatureK || 288;
    const prevC = (prevEqt - 273.15).toFixed(0);

    // 1. Gravity & Musculoskeletal stats
    const weightDiffPct = Math.round((Number(curGrav) - Number(prevGrav)) * 100);
    const sign = weightDiffPct >= 0 ? '+' : '';

    let prevGravText = '';
    let curGravText = '';
    let gravVerdict = '';
    let gravClass = 'verdict-safe';

    if (isCurrentEarth) {
      prevGravText = `${prevGrav}g (${prevName})`;
      curGravText = `1.00g (Standard Earth)`;
      gravVerdict = `Home sweet home! Natural paws 🐾`;
      gravClass = 'verdict-safe';
    } else {
      prevGravText = `${prevGrav}g (${prevName})`;
      curGravText = `${curGrav}g (${sign}${weightDiffPct}% vs ${prevName})`;
      if (curGrav > 1.25) {
        gravVerdict = `Heavy mud boots! High fatigue 🎒`;
        gravClass = 'verdict-warn';
      } else if (curGrav < 0.75) {
        gravVerdict = `Super bouncy trampoline hops! 🦘`;
        gravClass = 'verdict-info';
      } else {
        gravVerdict = `Cozy bouncy strides! 🐾`;
        gravClass = 'verdict-safe';
      }
    }

    // 2. Atmosphere & Respiration stats
    let prevAtmoText = isPrevEarth ? '78% N₂, 21% O₂ (1.0 bar)' : `${prevName} suit air`;
    let curAtmoText = '';
    let atmoVerdict = '';
    let atmoClass = 'verdict-safe';

    let compatScore = '78%';
    let compatTier = 'Tier 2 (Habitable Candidate)';
    let scoreClass = 'score-high';
    let kidRule = '';

    if (isCurrentEarth) {
      curAtmoText = '78% N₂, 21% O₂ (1.0 bar)';
      atmoVerdict = '100% Breathable! Visors up! 🌸';
      atmoClass = 'verdict-safe';
      compatScore = '100%';
      compatTier = 'Tier 1 (Home Sweet Home)';
      scoreClass = 'score-high';
      kidRule = 'Cadet Tom, you made it back safely! Take off your heavy suit, wiggle your paws, and go enjoy a big glass of chocolate milk! 🐾🥛';
    } else if (isLiquid) {
      curAtmoText = 'Dense steam & CO₂ vapor';
      atmoVerdict = 'No air! Sealed dive suit 🤿';
      atmoClass = 'verdict-danger';
      compatScore = '24%';
      compatTier = 'Tier 3 (Hostile Fluid Biosphere)';
      scoreClass = 'score-low';
      kidRule = 'Stay safe inside your boat, hold onto your life jacket, and watch out for giant friendly splashing waves! 🌊';
    } else if (curEqt > 700) {
      curAtmoText = 'Furnace CO₂ gas (50+ bar)';
      atmoVerdict = 'Danger furnace! Extreme heat 🚫';
      atmoClass = 'verdict-danger';
      compatScore = '6%';
      compatTier = 'Tier 4 (Scorching Furnace)';
      scoreClass = 'score-low';
      kidRule = 'Don\'t touch any hot rocks outside, keep your suit air conditioner on high, and stay close to the spaceship! 🔥';
    } else if (isGoldilocks) {
      curAtmoText = `Nitrogen & CO₂ (~${(curGrav * 1.05).toFixed(1)} bar)`;
      atmoVerdict = 'Visor locked! Bubble helmet on 🪖';
      atmoClass = 'verdict-safe';
      compatScore = '78%';
      compatTier = 'Tier 2 (Habitable Candidate)';
      scoreClass = 'score-high';
      kidRule = 'Never take off your shiny bubble helmet outside, drink lots of water, and enjoy your super-bouncy kangaroo hops! 🦘';
    } else if (curEqt < 220) {
      curAtmoText = 'Thin sub-atmospheric cryo gas';
      atmoVerdict = 'Heated bubble helmet! ❄️';
      atmoClass = 'verdict-warn';
      compatScore = '36%';
      compatTier = 'Tier 3 (Cryo-Glacial Frontier)';
      scoreClass = 'score-med';
      kidRule = 'Keep your suit heaters glowing cozy warm, don\'t slip on the shiny blue ice, and remember your fuzzy space socks! ❄️';
    } else {
      curAtmoText = `Toxic CO₂ envelope (~${(curGrav * 0.95).toFixed(1)} bar)`;
      atmoVerdict = 'Helmet locked! Space suit on 🪖';
      atmoClass = 'verdict-warn';
      compatScore = '42%';
      compatTier = 'Tier 3 (Dry Regolith World)';
      scoreClass = 'score-med';
      kidRule = 'Keep your space suit zipped tight, explore the pretty rock arches, and stay close to Professor Spike! 🐾';
    }

    // 3. Warmth & Temperature stats
    let prevTempText = isPrevEarth ? '288 K (15°C)' : `${prevEqt} K (${prevC}°C)`;
    let curTempText = `${curEqt} K (${curC}°C)`;
    let tempVerdict = '';
    let tempClass = 'verdict-safe';

    if (isCurrentEarth) {
      tempVerdict = 'Perfect picnic sunshine! ☀️';
      tempClass = 'verdict-safe';
    } else if (curEqt > 400) {
      tempVerdict = 'Hotter than a cookie oven! 🍪🔥';
      tempClass = 'verdict-danger';
    } else if (curEqt < 220) {
      tempVerdict = 'Colder than giant ice cream! 🍦';
      tempClass = 'verdict-warn';
    } else if (isGoldilocks) {
      tempVerdict = 'Cozy Goldilocks sweet spot! 🌤️';
      tempClass = 'verdict-safe';
    } else {
      tempVerdict = 'Chilly alien breeze! 🧣';
      tempClass = 'verdict-info';
    }

    // 4. Water & Oceans stats
    let prevWaterText = isPrevEarth ? '71% Blue Liquid Oceans' : (prev.isLiquidWorld ? 'Global alien ocean' : 'Rock & surface ice');
    let curWaterText = '';
    let waterVerdict = '';
    let waterClass = 'verdict-safe';

    if (isCurrentEarth) {
      curWaterText = '71% Liquid Blue Oceans';
      waterVerdict = 'Yummy fresh water & waves! 🏖️';
      waterClass = 'verdict-safe';
    } else if (isLiquid) {
      curWaterText = 'Endless global ocean';
      waterVerdict = 'Giant swimming pool! Watership boat 🚤';
      waterClass = 'verdict-info';
    } else if (curEqt > 380) {
      curWaterText = 'Boiled dry (atmospheric steam)';
      waterVerdict = 'Super dry rocks, no puddles! 🏜️';
      waterClass = 'verdict-warn';
    } else if (curEqt < 220) {
      curWaterText = 'Deep cryo-glacier ice sheets';
      waterVerdict = 'Frozen giant skating rink! ⛸️';
      waterClass = 'verdict-info';
    } else if (isGoldilocks) {
      curWaterText = 'Liquid lakes & cloud moisture';
      waterVerdict = 'Great for greenhouse pools! 💧';
      waterClass = 'verdict-safe';
    } else {
      curWaterText = 'Bedrock with trace subsurface ice';
      waterVerdict = 'Dig deep to melt ice cubes! ⛏️';
      waterClass = 'verdict-warn';
    }

    // Build the Dashboard HTML Table
    const html = `
      <div class="comparison-dashboard">
        <div class="dashboard-header-bar">
          <div class="dashboard-title-group">
            <span class="dashboard-badge">📊 PLANETARY COMPATIBILITY DASHBOARD</span>
            <h3 class="dashboard-title">${curName} <span style="color: var(--accent-cyan); font-size: 0.8em;">vs</span> ${prevName}</h3>
            <p class="dashboard-subtitle">Astrobiology Human Compatibility Analysis & Life Check</p>
          </div>
          <div class="dashboard-score-box ${scoreClass}">
            <span class="score-label">Compatibility</span>
            <span class="score-number">${compatScore}</span>
            <span class="score-tier">${compatTier}</span>
          </div>
        </div>

        <div class="dashboard-table-container">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Factor & Metric</th>
                <th>${prevName} (Departure)</th>
                <th>${curName} (Current)</th>
                <th>Cadet Life Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric-cell">
                  <span class="metric-icon">🦘</span>
                  <div>
                    <strong>Gravity & Muscle</strong>
                    <small>Jump & body weight</small>
                  </div>
                </td>
                <td>${prevGravText}</td>
                <td>${curGravText}</td>
                <td><span class="verdict-pill ${gravClass}">${gravVerdict}</span></td>
              </tr>
              <tr>
                <td class="metric-cell">
                  <span class="metric-icon">💨</span>
                  <div>
                    <strong>Air & Breathing</strong>
                    <small>Visor & oxygen</small>
                  </div>
                </td>
                <td>${prevAtmoText}</td>
                <td>${curAtmoText}</td>
                <td><span class="verdict-pill ${atmoClass}">${atmoVerdict}</span></td>
              </tr>
              <tr>
                <td class="metric-cell">
                  <span class="metric-icon">🌡️</span>
                  <div>
                    <strong>Warmth & Weather</strong>
                    <small>Equilibrium temp</small>
                  </div>
                </td>
                <td>${prevTempText}</td>
                <td>${curTempText}</td>
                <td><span class="verdict-pill ${tempClass}">${tempVerdict}</span></td>
              </tr>
              <tr>
                <td class="metric-cell">
                  <span class="metric-icon">💧</span>
                  <div>
                    <strong>Water & Oceans</strong>
                    <small>H₂O state & drinkability</small>
                  </div>
                </td>
                <td>${prevWaterText}</td>
                <td>${curWaterText}</td>
                <td><span class="verdict-pill ${waterClass}">${waterVerdict}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="dashboard-footer-note">
          <span class="footer-icon">🐾</span>
          <div class="footer-text">
            <strong>Professor Spike's Cadet Rule:</strong> ${kidRule}
          </div>
        </div>
      </div>
    `;

    // Plain text representation for accessibility and test assertions
    const text = `📊 Human Compatibility Briefing & Telemetry Dashboard for ${curName} vs ${prevName}:\n\n` +
      `• Musculoskeletal & Gravity: ${curGravText} vs ${prevGravText}. ${gravVerdict}\n\n` +
      `• Atmosphere & Respiration: ${curAtmoText}. ${atmoVerdict}\n\n` +
      `• Thermal & Weather: ${curTempText} vs ${prevTempText}. ${tempVerdict}\n\n` +
      `• Water & Oceans: ${curWaterText}. ${waterVerdict}\n\n` +
      `• Human Compatibility Rating: ${compatScore} — ${compatTier}. ${kidRule}`;

    return { html, text, compatScore, compatTier };
  }

  /**
   * Legacy alias forwarding to Human Compatibility Briefing
   */
  async generateLandingComparison(currentPlanet, previousPlanet) {
    return this.generateHumanCompatibilityComparison(currentPlanet, previousPlanet);
  }

  /**
   * Generates dynamic atmospheric entry warning and telemetry briefing.
   * Child-friendly, exciting, and reassuring for a 5-year-old cadet.
   */
  async generateEntryWarning(currentPlanet) {
    const isHot = currentPlanet.pl_eqt > 400;
    const isCold = currentPlanet.pl_eqt < 220;
    const isWater = currentPlanet.isLiquidWorld;

    const systemInstruction = `You are Professor Spike on the spaceship cockpit comms speaking to a 5-year-old child named Cadet Tom. Give an exciting, reassuring 2-sentence landing announcement for planet ${currentPlanet.pl_name}. Use simple, playful words (like giant waterslides, warm campfires, fluffy clouds, or ice rinks) so a child feels safe and thrilled!`;

    const prompt = `Planet Name: ${currentPlanet.pl_name}
Equilibrium Temp: ${currentPlanet.pl_eqt} K
Density: ${currentPlanet.pl_dens} g/cm³
Gravity: ${currentPlanet.surfaceGravity}g
Liquid World: ${isWater}`;

    if (this.hasApiKey()) {
      try {
        const text = await this.callFeatherlessAPI(systemInstruction, prompt);
        if (text) return { text, source: 'featherless' };
      } catch (err) {
        console.warn('[FeatherlessService] Entry warning API failed, using fallback:', err);
      }
    }

    if (isWater) {
      return {
        text: `Hold onto your seat, little cadet Tom! 🚀 We're sliding down like a giant waterslide into a world-sized swimming pool! Pop the boat floaties out—splashdown in three, two, one!`,
        source: 'offline'
      };
    } else if (isHot) {
      return {
        text: `Zoom! The sky outside looks like a giant glowing campfire! 🔥 Our spaceship's magic heat shield is keeping us cool as ice cream inside. Get ready for a smooth landing on the warm rocks!`,
        source: 'offline'
      };
    } else if (isCold) {
      return {
        text: `Look out the window, Cadet Tom—glittery snowflakes and ice crystals are swirling all around! ❄️ Hold on tight while our rocket lands like a feather on the giant ice skating rink!`,
        source: 'offline'
      };
    } else {
      return {
        text: `Wheee, down we go through soft, fluffy alien clouds! ☁️ Look through the window, you can see the pretty hills below. Touchdown coming right up, little explorer!`,
        source: 'offline'
      };
    }
  }

  /**
   * Interactive follow-up Q&A with the Teacher NPC.
   * Explains everything in cheerful, simple 5-year-old child-friendly words (ELI5).
   */
  async askTeacherQuestion(question, currentPlanet) {
    const isEarth = currentPlanet.pl_name === 'Earth' || currentPlanet.isEarth;
    const plName = isEarth ? 'Earth' : (currentPlanet.pl_name || 'this world');

    const systemInstruction = `You are Professor Spike, a fluffy, cheerful space dog scientist explaining outer space to a 5-year-old child named Cadet Tom on ${plName}!
Rules for explaining to a 5-year-old:
1. Use very simple, friendly words that a child understands easily.
2. Use fun, playful comparisons (like bouncing on trampolines, warm cookies, cozy sweaters, ice cream scoops, swimming pools, toy dump trucks, shiny treasure, and rubber duckies).
3. Keep answers warm, encouraging, and short (2 to 3 sentences maximum).
4. Do not use scary jargon or complicated formulas—explain gravity as how high you can bounce, temperature as cozy vs freezing ice cream vs hot ovens, and atmosphere as whether you need your bubble helmet!`;

    if (this.hasApiKey()) {
      try {
        const text = await this.callFeatherlessAPI(systemInstruction, question);
        if (text) return { text, source: 'featherless' };
      } catch (err) {
        console.warn('[FeatherlessService] Question API failed:', err);
      }
    }

    // Dynamic offline child-friendly responses (ELI5)
    const qLower = question.toLowerCase();
    const grav = currentPlanet.surfaceGravity || 1.0;
    const temp = currentPlanet.pl_eqt || 288;
    const dens = currentPlanet.pl_dens || 5.5;

    if (qLower.includes('grow') || qLower.includes('crop') || qLower.includes('farm') || qLower.includes('plant')) {
      if (isEarth) {
        return {
          text: `Hooray! 🌱 Earth has the best, sweetest garden dirt in the whole solar system! We can plant crunchy carrots, juicy red strawberries, and tall sunflowers right outside without needing any plastic domes!`,
          source: 'offline'
        };
      } else if (currentPlanet.isLiquidWorld) {
        return {
          text: `Splish splash! 🌊 Since this world is one gigantic swimming pool with no dirt, apple trees can't grow in the ground! But we can build floating lily-pad rafts and grow yummy glowing space-seaweed treats!`,
          source: 'offline'
        };
      } else if (temp > 400) {
        return {
          text: `Whoa, it is way too hot out here—hotter than a baking cookie oven! 🍪 Any regular seeds would pop into popcorn right away! We have to build super-cool bubble tents with giant ice-cube fans to grow our space strawberries!`,
          source: 'offline'
        };
      } else if (temp < 220) {
        return {
          text: `Brrr, it is freezing cold like a giant scoop of blueberry ice cream! 🍦 We need cozy heated glasshouses with soft purple lamps to keep our little space carrots snug and warm!`,
          source: 'offline'
        };
      } else {
        return {
          text: `Yay! 🌱 The weather here is nice and sunny, just like a picnic day! If we plant seeds inside little clear dome tents with lots of water, yummy space veggies will sprout up right away!`,
          source: 'offline'
        };
      }
    } else if (qLower.includes('mine') || qLower.includes('mineral') || qLower.includes('drill') || qLower.includes('metal') || qLower.includes('rock')) {
      if (dens > 5.0) {
        return {
          text: `Look down at your paws, cadet! 💎 The ground is packed with shiny, heavy treasure rocks and super-strong metals! We can scoop them up with our toy drill trucks to build awesome new spaceships!`,
          source: 'offline'
        };
      } else if (currentPlanet.isLiquidWorld) {
        return {
          text: `Under all that deep blue water, there are sparkly sea-crystals resting on the bottom! 🚤 We can send tiny yellow robot submarines swimming down to collect the treasures for us!`,
          source: 'offline'
        };
      } else {
        return {
          text: `Our scanner found lots of shiny silver pebbles and pretty glass sand! 🏖️ We can use them like colorful toy building blocks to build a cozy space playground fort!`,
          source: 'offline'
        };
      }
    } else if (qLower.includes('gravity') || qLower.includes('jump') || qLower.includes('bounce') || qLower.includes('heavy') || qLower.includes('weight')) {
      if (grav > 1.25) {
        return {
          text: `Oof! This big planet hugs your paws extra tight like wearing a super-heavy backpack full of toys! 🎒 You can walk around, but jumping feels like you're wearing heavy mud boots!`,
          source: 'offline'
        };
      } else if (grav < 0.75) {
        return {
          text: `Wheeee! 🦘 This planet has super-springy kangaroo gravity! If you give a little hop, you'll float way up into the sky just like bouncing on the biggest trampoline ever!`,
          source: 'offline'
        };
      } else {
        return {
          text: `Your boots feel just right! 🐾 Walking and hopping here feels just like playing tag in your backyard back home on Earth!`,
          source: 'offline'
        };
      }
    } else if (qLower.includes('safe') || qLower.includes('suit') || qLower.includes('outside') || qLower.includes('air') || qLower.includes('monster')) {
      return {
        text: `Don't worry, brave little cadet! 🦺 Your spacesuit is like a magical superhero costume that keeps you cozy, warm, and breathing sweet, clean air while we explore together!`,
        source: 'offline'
      };
    } else {
      return {
        text: `That is such a neat question, little explorer! 🌟 Exploring new planets is like opening a surprise toy box in the stars. With our shiny rocket and superhero suits, we can learn all its fun secrets safely together!`,
        source: 'offline'
      };
    }
  }

  /**
   * Direct fetch to Featherless AI (OpenAI compatible endpoint).
   */
  async callFeatherlessAPI(systemInstruction, userContent) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userContent }
          ],
          temperature: 0.7,
          max_tokens: 300
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Featherless API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No text generated by Featherless model.');
      }
      return content.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // Compatibility alias for existing callers
  async callGeminiAPI(systemInstruction, userContent) {
    return this.callFeatherlessAPI(systemInstruction, userContent);
  }

  /**
   * Generates a structured, scientifically accurate Human Compatibility debriefing offline.
   */
  generateOfflineHumanCompatibility(current, prev) {
    return this.generateCompatibilityDashboardData(current, prev).text;
  }

  /**
   * Generates a context-aware 3-sentence cozy comparison offline.
   */
  generateOfflineComparison(current, prev) {
    let gravitySentence = "";
    if (current.gravity > 1.3) {
      gravitySentence = `Welcome to ${current.name}, where you will feel noticeably heavier under ${current.gravity}g surface gravity compared to ${prev.name}'s ${prev.gravity || 1.0}g and Earth's gentle 1.0g pull.`;
    } else if (current.gravity < 0.8) {
      gravitySentence = `Look at that leap, cadet—with only ${current.gravity}g surface gravity on ${current.name}, you can bound across the surface far more effortlessly than on ${prev.name} or back home on Earth!`;
    } else {
      gravitySentence = `Stepping onto ${current.name} feels remarkably familiar, with its comfortable ${current.gravity}g gravity welcoming our boots just like Earth's 1.0g.`;
    }

    let habitabilitySentence = "";
    if (current.isLiquidWorld) {
      habitabilitySentence = `Unlike the solid soil of ${prev.name}, this world's low density of ${current.density} g/cm³ means we are floating atop a vast, deep planetary ocean with a humid, volatile-rich atmosphere.`;
    } else if (current.temperatureK > 400) {
      habitabilitySentence = `While Earth basks in a cozy 288 K, ${current.name} is a scorching furnace at ${current.temperatureK} K, making standard outdoor farming impossible without climate-sealed biodomes.`;
    } else if (current.temperatureK < 220) {
      habitabilitySentence = `With temperatures dipping to a crisp ${current.temperatureK} K, its frozen crust resembles a world-sized cryo-glacier compared to ${prev.name}.`;
    } else {
      habitabilitySentence = `Its equilibrium temperature of ${current.temperatureK} K places it squarely in a promising temperate bracket, far closer to Earth's sweet spot than the conditions on ${prev.name}.`;
    }

    let resourceSentence = "";
    if (current.density >= 5.0) {
      resourceSentence = `Our mining drill should strike rich veins of heavy transition metals here, though our agricultural team will need greenhouse domes to cultivate crops in this alien regolith.`;
    } else if (current.isLiquidWorld) {
      resourceSentence = `Farming will take the form of floating kelp aquaponics from our boat, while our mineral dredgers harvest deuterium and salts from the endless tides.`;
    } else {
      resourceSentence = `Light silicates will provide plenty of building materials for our base camp, making this a fascinating new frontier for both mining and greenhouse farming!`;
    }

    return `${gravitySentence} ${habitabilitySentence} ${resourceSentence}`;
  }
}

// Retain GeminiService export name as alias for seamless compatibility
export const GeminiService = FeatherlessAIService;
