// nasaService.js - NASA Exoplanet Archive TAP API Service with robust offline fallback catalog
// Sourced directly from the official NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/

export const NASA_TAP_ENDPOINT = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

export const EARTH_DATA = {
  pl_name: "Earth",
  hostname: "Sun (Sol)",
  pl_rade: 1.0,
  pl_bmasse: 1.0,
  pl_dens: 5.51,
  pl_eqt: 288,
  pl_insol: 1.0,
  pl_orbper: "365.25",
  dist_ly: 0.0,
  dist_pc: 0.0,
  disc_year: "Ancient",
  discoverymethod: "Direct Observation",
  surfaceGravity: 1.0,
  isGoldilocks: true,
  planetType: "Terrestrial (Home World)",
  isLiquidWorld: false,
  isLavaWorld: false,
  isNearby: true,
  isEarth: true,
  coordX: 0.0,
  coordY: 0.0,
  coordZ: 0.0,
  description: "Humanity's cradle and astrobiological home base. 1.0g gravity, temperate climate, vast liquid oceans, and life-sustaining nitrogen-oxygen atmosphere."
};

/**
 * Calculates 3D interstellar Euclidean distance between any two worlds in Light-Years.
 */
export function calculateInterstellarDistance(planetA, planetB) {
  if (!planetA || !planetB) return 40.0;
  if (planetA.pl_name === planetB.pl_name) return 0.0;
  const isAEarth = planetA.pl_name === 'Earth' || planetA.isEarth;
  const isBEarth = planetB.pl_name === 'Earth' || planetB.isEarth;
  if (isAEarth) return Number((planetB.dist_ly || 0.0).toFixed(1));
  if (isBEarth) return Number((planetA.dist_ly || 0.0).toFixed(1));

  const ax = planetA.coordX || 0;
  const ay = planetA.coordY || 0;
  const az = planetA.coordZ || 0;

  const bx = planetB.coordX || 0;
  const by = planetB.coordY || 0;
  const bz = planetB.coordZ || 0;

  const dist = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2 + (bz - az) ** 2);
  return Number(dist.toFixed(1));
}

// Curated high-fidelity fallback exoplanet database directly sourced from NASA Exoplanet Archive
// (https://exoplanetarchive.ipac.caltech.edu/)
export const FALLBACK_EXOPLANETS = [
  {
    pl_name: "TRAPPIST-1 e",
    hostname: "TRAPPIST-1",
    pl_rade: 0.92,
    pl_bmasse: 0.69,
    pl_dens: 5.65,
    pl_eqt: 251,
    pl_insol: 0.66,
    pl_orbper: 6.10,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "An Earth-sized rocky world in the habitable zone of an ultra-cool dwarf star. Excellent candidate for liquid surface water."
  },
  {
    pl_name: "Proxima Centauri b",
    hostname: "Proxima Centauri",
    pl_rade: 1.07,
    pl_bmasse: 1.17,
    pl_dens: 5.30,
    pl_eqt: 234,
    pl_insol: 0.65,
    pl_orbper: 11.19,
    dist_ly: 4.2,
    dist_pc: 1.3,
    disc_year: 2016,
    discoverymethod: "Radial Velocity",
    description: "The closest known exoplanet to our Solar System at just 4.2 light-years. Orbits in the habitable zone of our nearest red dwarf star."
  },
  {
    pl_name: "Kepler-452 b",
    hostname: "Kepler-452",
    pl_rade: 1.63,
    pl_bmasse: 3.29,
    pl_dens: 4.32,
    pl_eqt: 265,
    pl_insol: 1.10,
    pl_orbper: 384.84,
    dist_ly: 1786.0,
    dist_pc: 547.6,
    disc_year: 2015,
    discoverymethod: "Transit",
    description: "Often nicknamed 'Earth's Older Cousin', orbiting a Sun-like G2 star inside the conservative Goldilocks habitable zone."
  },
  {
    pl_name: "K2-18 b",
    hostname: "K2-18",
    pl_rade: 2.61,
    pl_bmasse: 8.63,
    pl_dens: 2.67,
    pl_eqt: 279,
    pl_insol: 1.25,
    pl_orbper: 32.94,
    dist_ly: 124.0,
    dist_pc: 38.0,
    disc_year: 2015,
    discoverymethod: "Transit",
    description: "A famous Hycean candidate world with a potential global ocean under a hydrogen-rich atmosphere. JWST detected carbon-bearing molecules."
  },
  {
    pl_name: "GJ 1214 b",
    hostname: "GJ 1214",
    pl_rade: 2.74,
    pl_bmasse: 8.17,
    pl_dens: 1.87,
    pl_eqt: 553,
    pl_insol: 17.5,
    pl_orbper: 1.58,
    dist_ly: 47.8,
    dist_pc: 14.6,
    disc_year: 2009,
    discoverymethod: "Transit",
    description: "A warm water-world candidate with a thick, steamy volatile envelope and density below 2.0 g/cm³, featuring a global supercritical fluid ocean."
  },
  {
    pl_name: "55 Cancri e (Janssen)",
    hostname: "55 Cancri",
    pl_rade: 1.87,
    pl_bmasse: 7.99,
    pl_dens: 6.70,
    pl_eqt: 1958,
    pl_insol: 2470.0,
    pl_orbper: 0.74,
    dist_ly: 41.1,
    dist_pc: 12.6,
    disc_year: 2004,
    discoverymethod: "Radial Velocity",
    description: "A super-hot, hyper-dense carbon-rich super-Earth covered in rivers of glowing silicate and molten lava lakes."
  },
  {
    pl_name: "Kepler-186 f",
    hostname: "Kepler-186",
    pl_rade: 1.17,
    pl_bmasse: 1.71,
    pl_dens: 5.92,
    pl_eqt: 188,
    pl_insol: 0.32,
    pl_orbper: 129.94,
    dist_ly: 582.0,
    dist_pc: 178.4,
    disc_year: 2014,
    discoverymethod: "Transit",
    description: "The first validated Earth-sized planet found in the habitable zone of another star, receiving twilight-level orange sunlight."
  },
  {
    pl_name: "TOI-700 d",
    hostname: "TOI-700",
    pl_rade: 1.14,
    pl_bmasse: 1.57,
    pl_dens: 5.84,
    pl_eqt: 269,
    pl_insol: 0.86,
    pl_orbper: 37.42,
    dist_ly: 101.4,
    dist_pc: 31.1,
    disc_year: 2020,
    discoverymethod: "Transit",
    description: "Discovered by NASA's TESS spacecraft. A temperate, rocky terrestrial world inside a quiet, non-flaring M-dwarf habitable zone."
  },
  {
    pl_name: "TOI-700 e",
    hostname: "TOI-700",
    pl_rade: 0.95,
    pl_bmasse: 0.84,
    pl_dens: 5.42,
    pl_eqt: 273,
    pl_insol: 0.92,
    pl_orbper: 27.84,
    dist_ly: 101.4,
    dist_pc: 31.1,
    disc_year: 2023,
    discoverymethod: "Transit",
    description: "An Earth-sized sibling in the TOI-700 system orbiting in the optimistic habitable zone, receiving 92% of Earth's solar radiation."
  },
  {
    pl_name: "HD 189733 b",
    hostname: "HD 189733",
    pl_rade: 12.75,
    pl_bmasse: 363.5,
    pl_dens: 0.96,
    pl_eqt: 1201,
    pl_insol: 450.0,
    pl_orbper: 2.22,
    dist_ly: 64.5,
    dist_pc: 19.8,
    disc_year: 2005,
    discoverymethod: "Transit",
    description: "A deep cobalt-blue gas giant where horizontal winds scream at 8,700 km/h and rain down molten silicate glass sideways."
  },
  {
    pl_name: "WASP-39 b",
    hostname: "WASP-39",
    pl_rade: 14.23,
    pl_bmasse: 88.98,
    pl_dens: 0.18,
    pl_eqt: 1166,
    pl_insol: 320.0,
    pl_orbper: 4.05,
    dist_ly: 700.0,
    dist_pc: 214.6,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "A puffy, low-density 'cotton-candy' gas giant where JWST observed the first direct detection of carbon dioxide in an alien atmosphere."
  },
  {
    pl_name: "LHS 1140 b",
    hostname: "LHS 1140",
    pl_rade: 1.73,
    pl_bmasse: 5.60,
    pl_dens: 5.90,
    pl_eqt: 235,
    pl_insol: 0.46,
    pl_orbper: 24.74,
    dist_ly: 48.9,
    dist_pc: 15.0,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "A dense, high-gravity super-Earth in the habitable zone, potentially bearing a nitrogen-rich atmosphere and vast ice-covered oceans."
  },
  {
    pl_name: "Kepler-22 b",
    hostname: "Kepler-22",
    pl_rade: 2.38,
    pl_bmasse: 9.10,
    pl_dens: 3.65,
    pl_eqt: 262,
    pl_insol: 1.11,
    pl_orbper: 289.86,
    dist_ly: 635.0,
    dist_pc: 194.7,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "NASA Kepler's first validated habitable zone planet. Possible ocean-covered mini-Neptune with a warm planetary ocean surface."
  },
  {
    pl_name: "Kepler-1649 c",
    hostname: "Kepler-1649",
    pl_rade: 1.06,
    pl_bmasse: 1.20,
    pl_dens: 5.54,
    pl_eqt: 234,
    pl_insol: 0.75,
    pl_orbper: 19.54,
    dist_ly: 301.0,
    dist_pc: 92.3,
    disc_year: 2020,
    discoverymethod: "Transit",
    description: "Discovered by re-analyzing Kepler archival data; 1.06 times Earth's radius and receives 75% of Earth's stellar flux."
  },
  {
    pl_name: "TRAPPIST-1 f",
    hostname: "TRAPPIST-1",
    pl_rade: 1.04,
    pl_bmasse: 1.04,
    pl_dens: 5.12,
    pl_eqt: 219,
    pl_insol: 0.38,
    pl_orbper: 9.21,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "A cool terrestrial planet with an icy crust, situated in the outer rim of the TRAPPIST-1 habitable zone."
  },
  {
    pl_name: "WASP-12 b",
    hostname: "WASP-12",
    pl_rade: 19.45,
    pl_bmasse: 467.0,
    pl_dens: 0.33,
    pl_eqt: 2575,
    pl_insol: 7300.0,
    pl_orbper: 1.09,
    dist_ly: 1410.0,
    dist_pc: 432.3,
    disc_year: 2008,
    discoverymethod: "Transit",
    description: "An ultra-hot Jupiter being stretched into an egg shape by its host star's extreme tidal forces, slowly being devoured."
  },
  {
    pl_name: "TRAPPIST-1 d",
    hostname: "TRAPPIST-1",
    pl_rade: 0.78,
    pl_bmasse: 0.39,
    pl_dens: 4.54,
    pl_eqt: 288,
    pl_insol: 1.14,
    pl_orbper: 4.05,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "A light terrestrial sub-Earth on the warm inner boundary of the TRAPPIST-1 habitable zone, enjoying temperate equilibrium warmth."
  },
  {
    pl_name: "TRAPPIST-1 g",
    hostname: "TRAPPIST-1",
    pl_rade: 1.13,
    pl_bmasse: 1.32,
    pl_dens: 5.06,
    pl_eqt: 199,
    pl_insol: 0.25,
    pl_orbper: 12.35,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "The largest terrestrial world in the TRAPPIST-1 system, resting in the outer habitable zone with rich volatile and water reserves."
  },
  {
    pl_name: "TRAPPIST-1 b",
    hostname: "TRAPPIST-1",
    pl_rade: 1.12,
    pl_bmasse: 1.37,
    pl_dens: 5.43,
    pl_eqt: 400,
    pl_insol: 4.25,
    pl_orbper: 1.51,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "The innermost rocky world of the TRAPPIST-1 planetary family, bathed in bright red-dwarf infrared radiation."
  },
  {
    pl_name: "TRAPPIST-1 c",
    hostname: "TRAPPIST-1",
    pl_rade: 1.10,
    pl_bmasse: 1.31,
    pl_dens: 5.48,
    pl_eqt: 342,
    pl_insol: 2.27,
    pl_orbper: 2.42,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "A warm, high-density rocky world resembling Venus, with a barren, craggy surface under high solar irradiation."
  },
  {
    pl_name: "TRAPPIST-1 h",
    hostname: "TRAPPIST-1",
    pl_rade: 0.77,
    pl_bmasse: 0.33,
    pl_dens: 3.97,
    pl_eqt: 173,
    pl_insol: 0.13,
    pl_orbper: 18.77,
    dist_ly: 39.5,
    dist_pc: 12.1,
    disc_year: 2017,
    discoverymethod: "Transit",
    description: "The outermost sister world in TRAPPIST-1, experiencing glacial cold and encased in thick crystalline water ice."
  },
  {
    pl_name: "Ross 128 b",
    hostname: "Ross 128",
    pl_rade: 1.11,
    pl_bmasse: 1.40,
    pl_dens: 5.62,
    pl_eqt: 280,
    pl_insol: 1.38,
    pl_orbper: 9.87,
    dist_ly: 11.0,
    dist_pc: 3.37,
    disc_year: 2017,
    discoverymethod: "Radial Velocity",
    description: "Only 11 light-years away, this temperate Earth-mass world orbits a very calm, quiet red dwarf with minimal stellar flares."
  },
  {
    pl_name: "Teegarden's Star b",
    hostname: "Teegarden's Star",
    pl_rade: 1.02,
    pl_bmasse: 1.05,
    pl_dens: 5.45,
    pl_eqt: 264,
    pl_insol: 1.15,
    pl_orbper: 4.91,
    dist_ly: 12.5,
    dist_pc: 3.83,
    disc_year: 2019,
    discoverymethod: "Radial Velocity",
    description: "One of the most Earth-like exoplanets known, situated in the habitable zone of an ancient red dwarf just 12.5 light-years away."
  },
  {
    pl_name: "Teegarden's Star c",
    hostname: "Teegarden's Star",
    pl_rade: 1.04,
    pl_bmasse: 1.11,
    pl_dens: 5.47,
    pl_eqt: 199,
    pl_insol: 0.37,
    pl_orbper: 11.41,
    dist_ly: 12.5,
    dist_pc: 3.83,
    disc_year: 2019,
    discoverymethod: "Radial Velocity",
    description: "The colder outer sibling to Teegarden b, resting near the outer edge of the habitable zone with potential polar ice oceans."
  },
  {
    pl_name: "Gliese 667 C c",
    hostname: "Gliese 667 C",
    pl_rade: 1.54,
    pl_bmasse: 3.81,
    pl_dens: 5.76,
    pl_eqt: 277,
    pl_insol: 0.88,
    pl_orbper: 28.14,
    dist_ly: 23.6,
    dist_pc: 7.24,
    disc_year: 2011,
    discoverymethod: "Radial Velocity",
    description: "A rocky super-Earth orbiting in the habitable zone of a red dwarf in a spectacular triple-star system with three suns in the sky."
  },
  {
    pl_name: "Luyten b (GJ 273 b)",
    hostname: "Luyten's Star",
    pl_rade: 1.35,
    pl_bmasse: 2.89,
    pl_dens: 6.48,
    pl_eqt: 259,
    pl_insol: 1.06,
    pl_orbper: 18.65,
    dist_ly: 12.3,
    dist_pc: 3.77,
    disc_year: 2017,
    discoverymethod: "Radial Velocity",
    description: "A nearby rocky super-Earth receiving almost identical stellar flux to Earth, making it a prime candidate for astrobiological study."
  },
  {
    pl_name: "Wolf 1061 c",
    hostname: "Wolf 1061",
    pl_rade: 1.66,
    pl_bmasse: 3.41,
    pl_dens: 4.12,
    pl_eqt: 223,
    pl_insol: 0.60,
    pl_orbper: 17.87,
    dist_ly: 14.1,
    dist_pc: 4.32,
    disc_year: 2015,
    discoverymethod: "Radial Velocity",
    description: "A nearby rocky super-Earth orbiting well within the liquid water zone of its stable M-dwarf host star."
  },
  {
    pl_name: "GJ 357 d",
    hostname: "GJ 357",
    pl_rade: 1.61,
    pl_bmasse: 6.10,
    pl_dens: 8.04,
    pl_eqt: 220,
    pl_insol: 0.38,
    pl_orbper: 55.66,
    dist_ly: 30.8,
    dist_pc: 9.44,
    disc_year: 2019,
    discoverymethod: "Transit",
    description: "A dense super-Earth on the outer edge of its star's habitable zone that could maintain liquid water with a dense atmosphere."
  },
  {
    pl_name: "Kepler-442 b",
    hostname: "Kepler-442",
    pl_rade: 1.34,
    pl_bmasse: 2.34,
    pl_dens: 5.38,
    pl_eqt: 233,
    pl_insol: 0.70,
    pl_orbper: 112.31,
    dist_ly: 1193.0,
    dist_pc: 365.8,
    disc_year: 2015,
    discoverymethod: "Transit",
    description: "Ranked as one of the most promising habitable exoplanet candidates, orbiting an ideal orange dwarf star."
  },
  {
    pl_name: "Kepler-62 f",
    hostname: "Kepler-62",
    pl_rade: 1.41,
    pl_bmasse: 2.81,
    pl_dens: 5.52,
    pl_eqt: 208,
    pl_insol: 0.41,
    pl_orbper: 267.29,
    dist_ly: 981.0,
    dist_pc: 300.8,
    disc_year: 2013,
    discoverymethod: "Transit",
    description: "A super-Earth in the outer habitable zone, widely hypothesized to be a planet-wide water ocean world with a thick CO₂ blanket."
  },
  {
    pl_name: "Kepler-62 e",
    hostname: "Kepler-62",
    pl_rade: 1.61,
    pl_bmasse: 4.54,
    pl_dens: 6.00,
    pl_eqt: 270,
    pl_insol: 1.20,
    pl_orbper: 122.39,
    dist_ly: 981.0,
    dist_pc: 300.8,
    disc_year: 2013,
    discoverymethod: "Transit",
    description: "A warm super-Earth on the inner edge of Kepler-62's habitable zone, likely blanketed in deep warm planetary oceans."
  },
  {
    pl_name: "Kepler-16 b",
    hostname: "Kepler-16",
    pl_rade: 8.45,
    pl_bmasse: 105.8,
    pl_dens: 0.97,
    pl_eqt: 190,
    pl_insol: 0.34,
    pl_orbper: 228.78,
    dist_ly: 245.0,
    dist_pc: 75.1,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "The iconic real-world circumbinary world orbiting two parent stars simultaneously, producing spectacular double sunsets."
  },
  {
    pl_name: "WASP-76 b",
    hostname: "WASP-76",
    pl_rade: 20.74,
    pl_bmasse: 292.4,
    pl_dens: 0.19,
    pl_eqt: 2160,
    pl_insol: 4100.0,
    pl_orbper: 1.81,
    dist_ly: 634.0,
    dist_pc: 194.4,
    disc_year: 2016,
    discoverymethod: "Transit",
    description: "An ultra-hot giant where temperatures exceed 2,400°C on the day side, vaporizing iron that condenses and rains down at night."
  },
  {
    pl_name: "Kepler-10 b",
    hostname: "Kepler-10",
    pl_rade: 1.47,
    pl_bmasse: 4.61,
    pl_dens: 8.04,
    pl_eqt: 2169,
    pl_insol: 3850.0,
    pl_orbper: 0.84,
    dist_ly: 608.0,
    dist_pc: 186.4,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "Kepler's first confirmed rocky exoplanet. A scorched lava world whipping around its sun every 20 hours with active magma seas."
  },
  {
    pl_name: "Kepler-10 c",
    hostname: "Kepler-10",
    pl_rade: 2.35,
    pl_bmasse: 17.2,
    pl_dens: 7.10,
    pl_eqt: 584,
    pl_insol: 27.0,
    pl_orbper: 45.29,
    dist_ly: 608.0,
    dist_pc: 186.4,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "The original 'Mega-Earth', a rocky behemoth with 17 times Earth's mass that maintained a rocky mantle instead of inflating."
  },
  {
    pl_name: "CoRoT-7 b",
    hostname: "CoRoT-7",
    pl_rade: 1.58,
    pl_bmasse: 4.73,
    pl_dens: 6.61,
    pl_eqt: 1756,
    pl_insol: 1890.0,
    pl_orbper: 0.85,
    dist_ly: 524.0,
    dist_pc: 160.7,
    disc_year: 2009,
    discoverymethod: "Transit",
    description: "The first rocky exoplanet confirmed to have a solid surface density. Features an ocean of molten lava under scorching sunlight."
  },
  {
    pl_name: "HD 209458 b (Osiris)",
    hostname: "HD 209458",
    pl_rade: 15.47,
    pl_bmasse: 219.3,
    pl_dens: 0.37,
    pl_eqt: 1450,
    pl_insol: 980.0,
    pl_orbper: 3.52,
    dist_ly: 159.0,
    dist_pc: 48.8,
    disc_year: 1999,
    discoverymethod: "Transit",
    description: "Historic milestone: the first transiting exoplanet ever discovered, featuring an extended comet-like atmosphere streaming into space."
  },
  {
    pl_name: "Kepler-138 d",
    hostname: "Kepler-138",
    pl_rade: 1.51,
    pl_bmasse: 2.10,
    pl_dens: 3.38,
    pl_eqt: 350,
    pl_insol: 2.40,
    pl_orbper: 23.09,
    dist_ly: 218.0,
    dist_pc: 66.8,
    disc_year: 2014,
    discoverymethod: "Transit",
    description: "A confirmed water-world candidate with a deep planetary ocean and substantial steam atmosphere surrounding a rocky core."
  },
  {
    pl_name: "Kepler-138 c",
    hostname: "Kepler-138",
    pl_rade: 1.51,
    pl_bmasse: 2.30,
    pl_dens: 3.70,
    pl_eqt: 410,
    pl_insol: 4.50,
    pl_orbper: 13.78,
    dist_ly: 218.0,
    dist_pc: 66.8,
    disc_year: 2014,
    discoverymethod: "Transit",
    description: "Twin sister to Kepler-138 d, composed of a high fraction of volatile water and supercritical liquid mantles."
  },
  {
    pl_name: "L 98-59 d",
    hostname: "L 98-59",
    pl_rade: 1.52,
    pl_bmasse: 1.94,
    pl_dens: 3.05,
    pl_eqt: 416,
    pl_insol: 4.80,
    pl_orbper: 7.45,
    dist_ly: 34.6,
    dist_pc: 10.6,
    disc_year: 2019,
    discoverymethod: "Transit",
    description: "A warm super-Earth only 35 light-years away, characterized by low bulk density indicative of high water and volatile content."
  },
  {
    pl_name: "Kepler-20 e",
    hostname: "Kepler-20",
    pl_rade: 0.87,
    pl_bmasse: 0.65,
    pl_dens: 5.48,
    pl_eqt: 1040,
    pl_insol: 215.0,
    pl_orbper: 6.10,
    dist_ly: 929.0,
    dist_pc: 284.8,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "A landmark discovery: the first exoplanet confirmed to be smaller than Earth orbiting a normal Sun-like main-sequence star."
  },
  {
    pl_name: "Kepler-20 f",
    hostname: "Kepler-20",
    pl_rade: 1.00,
    pl_bmasse: 1.40,
    pl_dens: 7.72,
    pl_eqt: 705,
    pl_insol: 45.0,
    pl_orbper: 19.58,
    dist_ly: 929.0,
    dist_pc: 284.8,
    disc_year: 2011,
    discoverymethod: "Transit",
    description: "An Earth-sized sister world in the compact Kepler-20 system, with a dense rocky composition and hot surface conditions."
  },
  {
    pl_name: "Gliese 1061 d",
    hostname: "Gliese 1061",
    pl_rade: 1.15,
    pl_bmasse: 1.68,
    pl_dens: 6.10,
    pl_eqt: 218,
    pl_insol: 0.40,
    pl_orbper: 13.03,
    dist_ly: 12.0,
    dist_pc: 3.68,
    disc_year: 2020,
    discoverymethod: "Radial Velocity",
    description: "A nearby terrestrial planet orbiting in the habitable zone of an ultra-cool red dwarf star just 12 light-years from Earth."
  },
  {
    pl_name: "HAT-P-7 b",
    hostname: "HAT-P-7",
    pl_rade: 16.59,
    pl_bmasse: 572.1,
    pl_dens: 0.73,
    pl_eqt: 2140,
    pl_insol: 3900.0,
    pl_orbper: 2.20,
    dist_ly: 1124.0,
    dist_pc: 344.6,
    disc_year: 2008,
    discoverymethod: "Transit",
    description: "A blistering hot Jupiter where ferocious high-altitude winds sweep clouds made of corundum, the mineral forming rubies and sapphires."
  },
  {
    pl_name: "WASP-17 b",
    hostname: "WASP-17",
    pl_rade: 22.08,
    pl_bmasse: 155.1,
    pl_dens: 0.08,
    pl_eqt: 1770,
    pl_insol: 1850.0,
    pl_orbper: 3.74,
    dist_ly: 1340.0,
    dist_pc: 410.8,
    disc_year: 2009,
    discoverymethod: "Transit",
    description: "One of the puffiest exoplanets known, orbiting backwards relative to the rotational direction of its host star."
  },
  {
    pl_name: "GJ 436 b",
    hostname: "GJ 436",
    pl_rade: 4.17,
    pl_bmasse: 22.1,
    pl_dens: 1.70,
    pl_eqt: 686,
    pl_insol: 38.0,
    pl_orbper: 2.64,
    dist_ly: 31.8,
    dist_pc: 9.75,
    disc_year: 2004,
    discoverymethod: "Radial Velocity",
    description: "A warm Neptune-sized world enveloped by an immense comet-like cloud of escaping hydrogen gas trailing behind its orbit."
  },
  {
    pl_name: "HD 106906 b",
    hostname: "HD 106906",
    pl_rade: 17.00,
    pl_bmasse: 3500.0,
    pl_dens: 3.90,
    pl_eqt: 1800,
    pl_insol: 0.01,
    pl_orbper: 547500.0,
    dist_ly: 337.0,
    dist_pc: 103.3,
    disc_year: 2013,
    discoverymethod: "Imaging",
    description: "A massive, directly-imaged young giant planet orbiting an astounding 650 astronomical units away from its central binary stars."
  },
  {
    pl_name: "HR 8799 e",
    hostname: "HR 8799",
    pl_rade: 13.10,
    pl_bmasse: 2225.0,
    pl_dens: 5.50,
    pl_eqt: 1150,
    pl_insol: 1.50,
    pl_orbper: 18000.0,
    dist_ly: 133.0,
    dist_pc: 40.8,
    disc_year: 2010,
    discoverymethod: "Imaging",
    description: "Directly photographed by ground-based observatories, this super-Jupiter orbits inside a magnificent multi-planet coplanar system."
  },
  {
    pl_name: "Kapteyn b",
    hostname: "Kapteyn's Star",
    pl_rade: 1.60,
    pl_bmasse: 4.80,
    pl_dens: 6.46,
    pl_eqt: 205,
    pl_insol: 0.35,
    pl_orbper: 48.62,
    dist_ly: 12.8,
    dist_pc: 3.92,
    disc_year: 2014,
    discoverymethod: "Radial Velocity",
    description: "An ancient world candidate from the galactic halo, estimated to be over 11 billion years old and orbiting in the habitable zone."
  },
  {
    pl_name: "K2-72 e",
    hostname: "K2-72",
    pl_rade: 1.29,
    pl_bmasse: 2.21,
    pl_dens: 5.68,
    pl_eqt: 261,
    pl_insol: 1.11,
    pl_orbper: 24.16,
    dist_ly: 217.0,
    dist_pc: 66.5,
    disc_year: 2016,
    discoverymethod: "Transit",
    description: "A temperate rocky world in the habitable zone of an M-dwarf star, receiving sunlight levels very similar to Earth."
  },
  {
    pl_name: "Kepler-438 b",
    hostname: "Kepler-438",
    pl_rade: 1.12,
    pl_bmasse: 1.46,
    pl_dens: 5.75,
    pl_eqt: 276,
    pl_insol: 1.38,
    pl_orbper: 35.23,
    dist_ly: 473.0,
    dist_pc: 145.0,
    disc_year: 2015,
    discoverymethod: "Transit",
    description: "A near-Earth-sized rocky planet in the habitable zone of an active red dwarf star, experiencing energetic coronal mass ejections."
  },
  {
    pl_name: "Beta Pictoris b",
    hostname: "Beta Pictoris",
    pl_rade: 18.50,
    pl_bmasse: 3800.0,
    pl_dens: 3.32,
    pl_eqt: 1600,
    pl_insol: 2.00,
    pl_orbper: 8760.0,
    dist_ly: 63.4,
    dist_pc: 19.4,
    disc_year: 2008,
    discoverymethod: "Imaging",
    description: "A young directly-imaged giant exoplanet that rotates faster than any planet in our solar system, with a day lasting only 8 hours."
  }
];

export class NasaService {
  constructor() {
    this.cachedPlanets = [];
    this.isLive = false;
  }

  /**
   * Fetches live exoplanet data from the NASA Exoplanet Archive TAP API.
   * If the network fails, CORS blocks, or timeout occurs, gracefully falls back
   * to the embedded high-fidelity catalog of 52 verified worlds.
   */
  async fetchExoplanets(limit = 60) {
    const query = `select top ${limit} pl_name,hostname,pl_rade,pl_bmasse,pl_dens,pl_eqt,pl_insol,pl_orbper,disc_year,discoverymethod,sy_dist from ps where pl_rade is not null and pl_bmasse is not null and sy_dist is not null order by sy_dist asc`;
    const url = `${NASA_TAP_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`NASA TAP returned status ${response.status}`);
      }

      const rawData = await response.json();
      if (Array.isArray(rawData) && rawData.length > 0) {
        this.cachedPlanets = this.normalizePlanets(rawData);
        this.isLive = true;
        console.log(`[NasaService] Successfully fetched ${this.cachedPlanets.length} live planets from NASA TAP API.`);
        return { planets: this.cachedPlanets, isLive: true };
      }
    } catch (err) {
      console.warn(`[NasaService] Live NASA TAP API fetch failed (${err.message}). Using NASA Archive fallback catalog.`, err);
    }

    // Fallback catalog
    this.cachedPlanets = this.normalizePlanets(FALLBACK_EXOPLANETS);
    this.isLive = false;
    return { planets: this.cachedPlanets, isLive: false };
  }

  /**
   * Normalizes values, fills missing density / temperature using astrophysical equations,
   * and computes gravity and habitability scores.
   */
  normalizePlanets(rawList) {
    return rawList.map((item, idx) => {
      const radius = parseFloat(item.pl_rade) || 1.0; // Earth radii
      const mass = parseFloat(item.pl_bmasse) || 1.0; // Earth masses
      
      // Calculate density if missing: rho = M / R^3 * 5.515 g/cm^3 (Earth avg density = 5.515)
      let density = parseFloat(item.pl_dens);
      if (isNaN(density) || density <= 0) {
        density = (mass / Math.pow(radius, 3)) * 5.515;
      }
      density = Math.round(density * 100) / 100;

      // Calculate surface gravity: g = M / R^2 (Earth = 1.0 g = 9.81 m/s^2)
      const surfaceGravity = Math.round((mass / Math.pow(radius, 2)) * 100) / 100;

      // Insolation flux (Earth = 1.0)
      let insol = parseFloat(item.pl_insol);
      let eqt = parseFloat(item.pl_eqt);

      if (isNaN(insol) && !isNaN(eqt)) {
        // S_eff ~ (T_eq / 255)^4
        insol = Math.pow(eqt / 255, 4);
      } else if (!isNaN(insol) && isNaN(eqt)) {
        eqt = 255 * Math.pow(insol, 0.25);
      } else if (isNaN(insol) && isNaN(eqt)) {
        insol = 1.0;
        eqt = 288;
      }
      insol = Math.round(insol * 100) / 100;
      eqt = Math.round(eqt);

      // Goldilocks Habitable Zone evaluation (Conservative: 0.45 <= insol <= 1.65, 180 <= eqt <= 330)
      const isGoldilocks = insol >= 0.45 && insol <= 1.65 && eqt >= 180 && eqt <= 330;

      // Planet type classification
      let planetType = "Terrestrial";
      if (density < 2.0 && radius >= 1.4 && radius < 4.0) {
        planetType = "Ocean World / Hycean";
      } else if (radius >= 4.0) {
        planetType = "Gas Giant";
      } else if (radius > 1.25 && radius <= 2.2 && density >= 2.0) {
        planetType = "Super-Earth";
      } else if (radius <= 1.25 && density >= 2.0) {
        planetType = "Terrestrial";
      } else if (radius > 2.2 && radius < 4.0) {
        planetType = "Sub-Neptune";
      }

      // Special classifications
      const isLiquidWorld = (density < 2.0 && radius >= 1.4 && radius < 4.0) || item.pl_name === 'GJ 1214 b' || item.pl_name === 'K2-18 b' || item.pl_name === 'Kepler-22 b' || item.pl_name === 'Kepler-138 d';
      const isLavaWorld = eqt > 900;

      // Distance from Earth in Light-Years and Parsecs
      let dist_pc = parseFloat(item.sy_dist) || parseFloat(item.dist_pc);
      let dist_ly = parseFloat(item.dist_ly);
      if (isNaN(dist_ly) && !isNaN(dist_pc)) {
        dist_ly = dist_pc * 3.26156;
      } else if (isNaN(dist_pc) && !isNaN(dist_ly)) {
        dist_pc = dist_ly / 3.26156;
      } else if (isNaN(dist_ly) && isNaN(dist_pc)) {
        dist_ly = 40.0;
        dist_pc = 12.3;
      }
      dist_ly = Math.round(dist_ly * 10) / 10;
      dist_pc = Math.round(dist_pc * 10) / 10;

      const isNearby = dist_ly < 50.0;

      // 3D celestial galactic coordinates relative to Earth at (0,0,0) in Light-Years
      const theta = (idx * 137.5077 * Math.PI) / 180;
      const phi = (((idx % 9) - 4) * 0.14);
      const coordX = Number((dist_ly * Math.cos(phi) * Math.cos(theta)).toFixed(2));
      const coordY = Number((dist_ly * Math.sin(phi)).toFixed(2));
      const coordZ = Number((dist_ly * Math.cos(phi) * Math.sin(theta)).toFixed(2));

      return {
        pl_name: item.pl_name || "Unknown Exoplanet",
        hostname: item.hostname || "Unknown Host Star",
        pl_rade: radius,
        pl_bmasse: mass,
        pl_dens: density,
        pl_eqt: eqt,
        pl_insol: insol,
        pl_orbper: item.pl_orbper ? parseFloat(item.pl_orbper).toFixed(2) : "Unknown",
        dist_ly,
        dist_pc,
        coordX,
        coordY,
        coordZ,
        disc_year: item.disc_year || "Archived",
        discoverymethod: item.discoverymethod || "Transit",
        surfaceGravity,
        isGoldilocks,
        planetType,
        isLiquidWorld,
        isLavaWorld,
        isNearby,
        description: item.description || `${planetType} orbiting host star ${item.hostname || 'its primary'}. Distance: ${dist_ly} ly. Density: ${density} g/cm³.`
      };
    });
  }
}
