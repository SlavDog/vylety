import { useState, useEffect } from 'react';
import Mapa from './components/Mapa';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import ImageViewer from './components/ImageViewer';
import gpxParser from 'gpxparser';
import { Compass, AlertTriangle, RefreshCw, ChevronUp, ChevronDown, X } from 'lucide-react';

// Hardcoded mock data of "Stezka Českem" as fallback when WordPress API is down or CORS blocked.
// It matches the exact WordPress REST API JSON structure.
const _MOCK_USEKY = [
  // Parent 12: Krušné hory
  {
    "id": 12,
    "parent": 0,
    "title": { "rendered": "Krušné hory" },
    "content": { "rendered": "<p>Krušné hory jsou jedním z nejpozoruhodnějších pohoří v České republice. Tato etapa nabízí drsnou, ale fascinující severskou atmosféru, hluboké smrkové lesy a rozlehlá rašeliniště.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "",
      "fotogalerie": []
    }
  },
  {
    "id": 121,
    "parent": 12,
    "title": { "rendered": "Krušné hory - 1. den" },
    "content": { "rendered": "<p>První den jsme šli přes rašeliniště u Božího Daru, kde ranní mlha vytvářela tajemné siluety stromů. Cesta začíná v nejzápadnějším bodě republiky.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/krusnehory.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Ranní mlha nad rašeliništěm u Božího Daru",
          "lat": "50.410",
          "lng": "12.925"
        }
      ]
    }
  },
  {
    "id": 122,
    "parent": 12,
    "title": { "rendered": "Krušné hory - 2. den" },
    "content": { "rendered": "<p>Druhý den nás čekal výstup na Klínovec (1244 m n. m.). Z rozhledny byl nádherný kruhový výhled. Trasa nás dále vedla přes Měděnec s historickými doly.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/krusnehory.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Výhled na Klínovec z okolních hřebenů",
          "lat": "50.395",
          "lng": "12.967"
        }
      ]
    }
  },

  // Parent 13: České Švýcarsko
  {
    "id": 13,
    "parent": 0,
    "title": { "rendered": "České Švýcarsko" },
    "content": { "rendered": "<p>Tajemný svět pískovcových měst a skalních bran. České Švýcarsko je jedním z nejromantičtějších koutů naší země, plný stinných roklí a strmých skalních vyhlídek.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "",
      "fotogalerie": []
    }
  },
  {
    "id": 131,
    "parent": 13,
    "title": { "rendered": "České Švýcarsko - 1. den" },
    "content": { "rendered": "<p>Tuto etapu jsme zahájili v Děčíně a stoupali k proslulé Pravčické bráně, největší přirozené skalní bráně v Evropě. Její monumentálnost vás doslova ohromí.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/ceskesvycarsko.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Pravčická brána - ikona Českého Švýcarska",
          "lat": "50.884",
          "lng": "14.281"
        }
      ]
    }
  },
  {
    "id": 132,
    "parent": 13,
    "title": { "rendered": "České Švýcarsko - 2. den" },
    "content": { "rendered": "<p>Následoval sestup do Hřenska a plavba na lodičkách v Edmundově soutěsce. Druhý den jsme vystoupali na Jetřichovické vyhlídky (Mariina skála).</p>" },
    "acf": {
      "absolvovano": false,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/ceskesvycarsko.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Jetřichovické vyhlídky při západu slunce",
          "lat": "50.852",
          "lng": "14.394"
        }
      ]
    }
  },

  // Parent 14: Krkonoše
  {
    "id": 14,
    "parent": 0,
    "title": { "rendered": "Krkonoše" },
    "content": { "rendered": "<p>Přechod nejvyššího českého pohoří je opravdovou zkouškou zdatnosti. Krkonošská tundra, ledovcové kary, hučící vodopády a nekonečné hřebenové cesty.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "",
      "fotogalerie": []
    }
  },
  {
    "id": 141,
    "parent": 14,
    "title": { "rendered": "Krkonoše - 1. den" },
    "content": { "rendered": "<p>Začali jsme stoupáním z Harrachova kolem Mumlavského vodopádu k Prameni Labe, ležícímu na Labské louce.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/krkonose.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Pramen řeky Labe na krkonošském hřebeni",
          "lat": "50.776",
          "lng": "15.535"
        }
      ]
    }
  },
  {
    "id": 142,
    "parent": 14,
    "title": { "rendered": "Krkonoše - 2. den" },
    "content": { "rendered": "<p>Třetí den byl ve znamení výstupu na naši nejvyšší horu Sněžku (1603 m n. m.). Zdolali jsme ji brzy ráno, abychom se vyhnuli davům.</p>" },
    "acf": {
      "absolvovano": true,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/krkonose.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Vrchol Sněžky obklopený ranními mraky",
          "lat": "50.736",
          "lng": "15.740"
        }
      ]
    }
  },

  // Parent 15: Orlické hory
  {
    "id": 15,
    "parent": 0,
    "title": { "rendered": "Orlické hory" },
    "content": { "rendered": "<p>Tato trasa prochází malebným hřebenem Orlických hor, který je posetý historickým československým opevněním z let 1935-1938.</p>" },
    "acf": {
      "absolvovano": false,
      "gpx_soubor": "",
      "fotogalerie": []
    }
  },
  {
    "id": 151,
    "parent": 15,
    "title": { "rendered": "Orlické hory - 1. den" },
    "content": { "rendered": "<p>Plánujeme jít přes Masarykovu chatu na Šerlichu, kde si dáme vyhlášené borůvkové knedlíky. Dále trasa pokračuje přes nejvyšší bod pohoří Velkou Deštnou.</p>" },
    "acf": {
      "absolvovano": false,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/orlickehory.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Husté lesy podél hřebene Orlických hor",
          "lat": "50.320",
          "lng": "16.381"
        }
      ]
    }
  },

  // Parent 16: Šumava (Neabsolvovaný jednodílný výlet s vlastním GPX souborem)
  {
    "id": 16,
    "parent": 0,
    "title": { "rendered": "Šumava" },
    "content": { "rendered": "<p>Šumava neboli Zelené plíce Evropy. Obrovské lesy, rašelinná slatě s jezírky a ledovcová jezera obklopená karovými stěnami.</p>" },
    "acf": {
      "absolvovano": false,
      "gpx_soubor": "https://tvojedomena.cz/wp-content/uploads/sumava.gpx",
      "fotogalerie": [
        {
          "obrazek": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
          "popisek": "Klidná hladina ledovcového Plešného jezera",
          "lat": "48.778",
          "lng": "13.865"
        }
      ]
    }
  }
];

// Helper to extract a clean filename slug from title for locating local fallback GPX
function getSlugFromTitle(title) {
  const clean = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (clean.includes("krusne")) return "krusnehory";
  if (clean.includes("svycarsko")) return "ceskesvycarsko";
  if (clean.includes("krkonose")) return "krkonose";
  if (clean.includes("orlicke")) return "orlickehory";
  if (clean.includes("sumava")) return "sumava";
  return "krusnehory";
}

// Helper to decode HTML entities (e.g. &#8211; pomlčka)
function decodeHTML(html) {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Helper to safely extract string from possible WP REST object or raw string
function extractString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    // If it has a rendered property (common in WordPress REST API)
    if (val.rendered && typeof val.rendered === 'string') return val.rendered;
    const innerVal = val.popisek || val.caption || val.description || val.title || '';
    if (typeof innerVal === 'object') {
      return innerVal.rendered || '';
    }
    return String(innerVal);
  }
  return '';
}

// Helper to fallback to gorgeous Unsplash pictures if WordPress contains domain placeholder image links
function resolveImageUrl(url, index = 0) {
  if (url && url.includes('tvojedomena.cz')) {
    const fallbacks = [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ];
    return fallbacks[index % fallbacks.length];
  }
  return url;
}

// Helper to parse date string Y-m-d or Ymd to native Date object
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim();
  if (cleanStr === '') return null;

  let year, month, day;

  if (cleanStr.includes('-')) {
    // Format Y-m-d (e.g. "2026-07-19")
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (cleanStr.length === 8 && /^\d{8}$/.test(cleanStr)) {
    // Format Ymd (e.g. "20260607")
    year = parseInt(cleanStr.substring(0, 4), 10);
    month = parseInt(cleanStr.substring(4, 6), 10) - 1;
    day = parseInt(cleanStr.substring(6, 8), 10);
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

// Helper to format date string to cs-CZ locale
function formatDate(dateStr) {
  const dateObj = parseDate(dateStr);
  if (!dateObj) return '';
  return dateObj.toLocaleDateString('cs-CZ');
}

// Helper to construct date range string from subsegments of a trip
function formatTripDates(tripDays) {
  if (!tripDays || tripDays.length === 0) return '';
  
  const dates = tripDays
    .map(d => d.acf?.datum)
    .filter(d => typeof d === 'string' && d.trim() !== '')
    .sort();

  if (dates.length === 0) return '';

  const parsedDates = [];
  const uniqueStrDates = new Set();
  
  dates.forEach(d => {
    if (uniqueStrDates.has(d)) return;
    uniqueStrDates.add(d);
    
    const dateObj = parseDate(d);
    if (dateObj) {
      parsedDates.push({
        str: d,
        date: dateObj
      });
    }
  });

  parsedDates.sort((a, b) => a.date - b.date);

  if (parsedDates.length === 0) return '';

  const groups = [];
  let currentGroup = [];

  parsedDates.forEach((pDate, idx) => {
    if (idx === 0) {
      currentGroup.push(pDate);
    } else {
      const prevDate = parsedDates[idx - 1].date;
      const diffTime = pDate.date.getTime() - prevDate.getTime();
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (diffTime > oneWeekInMs) {
        groups.push(currentGroup);
        currentGroup = [pDate];
      } else {
        currentGroup.push(pDate);
      }
    }
  });
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const groupStrings = groups.map(group => {
    if (group.length === 1) {
      return formatDate(group[0].str);
    } else {
      const first = group[0].date;
      const last = group[group.length - 1].date;
      
      const dayA = first.getDate();
      const monthA = first.getMonth() + 1;
      const yearA = first.getFullYear();
      
      const dayB = last.getDate();
      const monthB = last.getMonth() + 1;
      const yearB = last.getFullYear();

      if (yearA === yearB) {
        return `${dayA}. ${monthA}. – ${dayB}. ${monthB}. ${yearB}`;
      } else {
        return `${dayA}. ${monthA}. ${yearA} – ${dayB}. ${monthB}. ${yearB}`;
      }
    }
  });

  return groupStrings.join(', ');
}

export default function App() {
  const [useky, setUseky] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [activeDayId, setActiveDayId] = useState(null);
  const [hoveredTripId, setHoveredTripId] = useState(null);
  const [hoveredDayId, setHoveredDayId] = useState(null);
  const [gpxStatsMap, setGpxStatsMap] = useState({});
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(true);
  const [viewerPhotos, setViewerPhotos] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('stezka_welcome_shown');
      return stored !== 'true';
    } catch {
      return true;
    }
  });

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
    try {
      localStorage.setItem('stezka_welcome_shown', 'true');
    } catch (e) {
      console.warn('LocalStorage is not available:', e);
    }
  };

  // Expand sidebar on mobile when a trip is selected (e.g. from a map click)
  useEffect(() => {
    if (activeTripId !== null) {
      setIsMobileExpanded(true);
    }
  }, [activeTripId]);

  // Auto-open reader modal when a day segment is selected
  useEffect(() => {
    if (activeDayId !== null) {
      setIsStoryModalOpen(true);
    }
  }, [activeDayId]);

  const handleOpenViewer = (photos, index) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
  };

  const handleCloseViewer = () => {
    setViewerIndex(null);
  };

  const handlePrevPhoto = () => {
    setViewerIndex(prev => (prev > 0 ? prev - 1 : viewerPhotos.length - 1));
  };

  const handleNextPhoto = () => {
    setViewerIndex(prev => (prev < viewerPhotos.length - 1 ? prev + 1 : 0));
  };

  // Helper to parse GPX XML string safely supporting tracks, routes, and waypoints
  const parseGpxText = (text) => {
    const gpx = new gpxParser();
    gpx.parse(text);

    let coordinates = [];
    let distance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;

    if (gpx.tracks && gpx.tracks.length > 0) {
      const track = gpx.tracks[0];
      coordinates = track.points.map(p => [p.lat, p.lon]);
      distance = Math.round((track.distance && track.distance.total ? track.distance.total : 0) / 1000); // km
      elevationGain = Math.round(track.elevation ? (track.elevation.pos || 0) : 0);
      elevationLoss = Math.round(track.elevation ? (track.elevation.neg || 0) : 0);
    } else if (gpx.routes && gpx.routes.length > 0) {
      const route = gpx.routes[0];
      coordinates = route.points.map(p => [p.lat, p.lon]);
      distance = Math.round((route.distance && route.distance.total ? route.distance.total : 0) / 1000); // km
      elevationGain = Math.round(route.elevation ? (route.elevation.pos || 0) : 0);
      elevationLoss = Math.round(route.elevation ? (route.elevation.neg || 0) : 0);
    } else if (gpx.waypoints && gpx.waypoints.length > 0) {
      coordinates = gpx.waypoints.map(p => [p.lat, p.lon]);
      distance = 0;
      elevationGain = 0;
      elevationLoss = 0;
    } else {
      throw new Error("GPX soubor neobsahuje žádná data (tracks, routes ani waypoints)");
    }

    return {
      coordinates,
      distance,
      elevationGain,
      elevationLoss
    };
  };

  // Fetch and parse GPX tracks from GPX file URLs
  const loadGpxData = async (gpxUrl, mockPath) => {
    if (!gpxUrl || typeof gpxUrl !== 'string' || gpxUrl.trim() === '') {
      return {
        coordinates: [],
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0
      };
    }

    try {
      // If gpxUrl is not a valid URL string starting with http or /api-gpx, use mockPath immediately
      if (!gpxUrl.startsWith('http') && !gpxUrl.startsWith('/api-gpx')) {
        const fallbackRes = await fetch(mockPath);
        if (!fallbackRes.ok) throw new Error("Nelze načíst záložní GPX soubor");
        const text = await fallbackRes.text();
        return parseGpxText(text);
      }

      let response;
      try {
        // If gpxUrl starts with http, replace the domain with the proxy prefix, otherwise use directly
        const targetUrl = gpxUrl.startsWith('http')
          ? gpxUrl.replace(/^https?:\/\/[^/]+/, '/api-gpx')
          : gpxUrl;
        response = await fetch(targetUrl);
      } catch (e) {
        console.warn(`Přímé stahování z URL ${gpxUrl} selhalo, zkouším záložní cestu:`, e);
        response = await fetch(mockPath);
      }

      if (!response.ok) {
        console.warn(`Nepodařilo se stáhnout GPX (status: ${response.status}), zkouším záložní cestu.`);
        response = await fetch(mockPath);
      }

      const text = await response.text();

      // If response is HTML (e.g. 404 page or WEDOS challenge page), reject it
      if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
        throw new Error("Obdržen HTML kód namísto platného GPX XML souboru.");
      }

      return parseGpxText(text);
    } catch (e) {
      console.error(`Chyba při stahování/parsování GPX z URL ${gpxUrl}:`, e);
      // Absolute fallback if everything fails
      return {
        coordinates: [],
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let segmentsData = [];

      try {
        // Request 100 items per page and standard ACF format to get full image objects
        const res = await fetch('/api-gpx/wp-json/wp/v2/useky?per_page=100&acf_format=standard');
        if (!res.ok) throw new Error("Chyba při načítání dat z WordPress API");
        segmentsData = await res.json();

        if (!segmentsData || segmentsData.length === 0) {
          throw new Error("Nebyly nalezeny žádné úseky");
        }
        setUsingMockData(false);
      } catch (e) {
        console.error("Nepodařilo se načíst data z API:", e);
        setError("Je nám líto, ale nepodařilo se načíst data.");
        setLoading(false);
        return;
      }

      // Normalize WordPress REST API custom fields format to match the internal structure
      segmentsData = segmentsData.map(segment => {
        // Normalize IDs to numbers to avoid string/number type comparison issues
        segment.id = Number(segment.id);
        segment.parent = Number(segment.parent) || 0;

        // Decode HTML entities in title
        if (segment.title && segment.title.rendered) {
          segment.title.rendered = decodeHTML(segment.title.rendered);
        }

        if (segment.acf) {
          // Format date if present
          segment.acf.formattedDatum = segment.acf.datum ? formatDate(segment.acf.datum) : '';

          // Decode HTML entities in segment name if present
          if (segment.acf.nazev_useku) {
            segment.acf.nazev_useku = decodeHTML(segment.acf.nazev_useku);
          }

          // Normalize absolvovano to boolean (WordPress REST API can return strings like "0" or "1" or empty string)
          const val = segment.acf.absolvovano;
          segment.acf.absolvovano = val === true || val === 1 || val === '1' || val === 'true';

          // Normalize GPX soubor (WordPress REST API can return false/null/empty string)
          if (!segment.acf.gpx_soubor || typeof segment.acf.gpx_soubor !== 'string' || segment.acf.gpx_soubor.trim() === '') {
            segment.acf.gpx_soubor = '';
          }

          // 1. Build fotogalerie array or filter out any empty entries
          const hasValidFotogalerie = segment.acf.fotogalerie &&
            Array.isArray(segment.acf.fotogalerie) &&
            segment.acf.fotogalerie.some(f => f && (
              (f.obrazek && typeof f.obrazek === 'string' && f.obrazek.trim() !== '') ||
              (f.obrazek && typeof f.obrazek === 'object' && f.obrazek.url)
            ));

          if (hasValidFotogalerie) {
            segment.acf.fotogalerie = segment.acf.fotogalerie
              .filter(f => f && (
                (f.obrazek && typeof f.obrazek === 'string' && f.obrazek.trim() !== '') ||
                (f.obrazek && typeof f.obrazek === 'object' && f.obrazek.url)
              ))
              .map(f => {
                if (typeof f.obrazek === 'object') {
                  const img = f.obrazek;
                  const cap = f.popisek || f.caption || f.description || f.title ||
                    img.popisek || img.caption || img.description || img.title || "";
                  return {
                    obrazek: img.url,
                    popisek: extractString(cap)
                  };
                }
                const cap = f.popisek || f.caption || f.description || f.title || "";
                return {
                  obrazek: f.obrazek,
                  popisek: extractString(cap)
                };
              });
          } else {
            const fotogalerie = [];
            for (let i = 1; i <= 10; i++) {
              const imgObj = segment.acf[`obrazek_${i}`];
              if (imgObj && typeof imgObj === 'object' && imgObj.url) {
                const cap = imgObj.popisek || imgObj.caption || imgObj.description || imgObj.title || "";
                fotogalerie.push({
                  obrazek: imgObj.url,
                  popisek: extractString(cap)
                });
              } else if (imgObj && typeof imgObj === 'string' && imgObj.trim() !== '') {
                fotogalerie.push({
                  obrazek: imgObj,
                  popisek: ""
                });
              }
            }
            segment.acf.fotogalerie = fotogalerie;
          }

          // 2. Map vypraveni_o_ceste to content.rendered if content is empty
          if ((!segment.content || !segment.content.rendered) && segment.acf.vypraveni_o_ceste) {
            segment.content = {
              rendered: segment.acf.vypraveni_o_ceste
            };
          }
        }
        return segment;
      });

      // Download and parse GPX files for each segment
      const statsMap = {};
      const segmentsWithCoordinates = [];

      for (const segment of segmentsData) {
        // Parent trips do not have GPX files, EXCEPT if they are uncompleted single-route trips
        const isParent = !segment.parent || segment.parent === 0;

        // If a parent trip has at least one subsegment with GPX, we treat it as a grouped trip
        const hasSubsegmentWithGpx = isParent && segmentsData.some(sub =>
          Number(sub.parent) === Number(segment.id) &&
          sub.acf?.gpx_soubor &&
          sub.acf.gpx_soubor.trim() !== ''
        );

        const isSingleRouteTrip = isParent &&
          segment.acf?.absolvovano === false &&
          segment.acf?.gpx_soubor &&
          !hasSubsegmentWithGpx;

        if (isParent && !isSingleRouteTrip) {
          segment.coordinates = [];
          segmentsWithCoordinates.push(segment);
          continue;
        }

        const slug = segment.slug || getSlugFromTitle(segment.title?.rendered || '');
        const mockGpxPath = `/gpx/${slug}.gpx`;
        const rawGpxUrl = segment.acf?.gpx_soubor || '';
        const gpxUrl = rawGpxUrl ? rawGpxUrl.replace('https://mudr-alena-hamplova.cz', '/api-gpx') : '';

        const parsedGpx = await loadGpxData(gpxUrl, mockGpxPath);

        let coords = parsedGpx.coordinates;
        let dist = parsedGpx.distance;
        let elevGain = parsedGpx.elevationGain;
        let elevLoss = parsedGpx.elevationLoss;

        // Slice GPX coordinates for mock/local data to show separate paths for Day 1 and Day 2
        if (gpxUrl && gpxUrl.includes('tvojedomena.cz')) {
          const title = segment.title?.rendered || '';
          if (title.includes("1. den")) {
            coords = coords.slice(0, Math.ceil(coords.length / 2));
            dist = Math.round(dist / 2) || 12;
            elevGain = Math.round(elevGain / 2) || 280;
            elevLoss = Math.round(elevLoss / 2) || 260;
          } else if (title.includes("2. den")) {
            coords = coords.slice(Math.floor(coords.length / 2) - 1);
            dist = Math.round(dist / 2) || 10;
            elevGain = Math.round(elevGain / 2) || 240;
            elevLoss = Math.round(elevLoss / 2) || 250;
          }
        }

        statsMap[segment.id] = {
          distance: dist,
          elevationGain: elevGain,
          elevationLoss: elevLoss
        };

        // Attach parsed coordinates to segment object directly
        segment.coordinates = coords;
        segmentsWithCoordinates.push(segment);
      }

      // 1. Separate main trips and day segments
      const mainTrips = segmentsWithCoordinates.filter(s => !s.parent || s.parent === 0);
      const days = segmentsWithCoordinates.filter(s => s.parent && s.parent !== 0);

      // Robust check: if any day has a parent ID not present in mainTrips, create a dummy parent
      const parentIds = new Set(mainTrips.map(t => t.id));
      days.forEach(day => {
        if (!parentIds.has(day.parent)) {
          const parentId = day.parent;
          const parentTitle = day.title?.rendered?.split(' - ')[0] || `Výlet #${parentId}`;
          const newParent = {
            id: parentId,
            parent: 0,
            title: { rendered: parentTitle },
            acf: { absolvovano: false },
            coordinates: [],
            sub_segments: []
          };
          mainTrips.push(newParent);
          parentIds.add(parentId);
        }
      });

      // 2. Nest days into their parent trips
      const groupedTrips = mainTrips.map(trip => {
        const hasSubsegmentWithGpx = segmentsData.some(sub =>
          Number(sub.parent) === Number(trip.id) &&
          sub.acf?.gpx_soubor &&
          sub.acf.gpx_soubor.trim() !== ''
        );

        const isSingleRouteTrip = trip.acf?.absolvovano === false &&
          trip.acf?.gpx_soubor &&
          !hasSubsegmentWithGpx;

        if (isSingleRouteTrip) {
          trip.sub_segments = [];
          trip.dny = [];
          trip.formattedDatum = trip.acf?.datum ? formatDate(trip.acf.datum) : '';
          // Coordinates and stats are already loaded from its GPX file!
          return trip;
        }

        const tripDays = days.filter(d => d.parent === trip.id);

        // Sort days numerically by title
        tripDays.sort((a, b) => {
          const tA = a.title?.rendered || '';
          const tB = b.title?.rendered || '';
          return tA.localeCompare(tB, undefined, { numeric: true, sensitivity: 'base' });
        });

        trip.sub_segments = tripDays;
        trip.dny = tripDays; // dual naming just in case
        trip.formattedDatum = formatTripDates(tripDays);

        // Combined coordinates of all its days
        trip.coordinates = tripDays.flatMap(d => d.coordinates || []);

        // Compute total stats for the parent trip
        const totalDistance = tripDays.reduce((sum, d) => sum + (statsMap[d.id]?.distance || 0), 0);
        const totalElevationGain = tripDays.reduce((sum, d) => sum + (statsMap[d.id]?.elevationGain || 0), 0);
        const totalElevationLoss = tripDays.reduce((sum, d) => sum + (statsMap[d.id]?.elevationLoss || 0), 0);

        statsMap[trip.id] = {
          distance: totalDistance,
          elevationGain: totalElevationGain,
          elevationLoss: totalElevationLoss
        };

        // Complete if all sub-days are complete
        trip.acf = trip.acf || {};
        trip.acf.absolvovano = tripDays.length > 0
          ? tripDays.every(d => d.acf?.absolvovano === true)
          : (trip.acf.absolvovano || false);

        return trip;
      });

      // Sort main trips: newest first, oldest last (based on the latest subsegment date)
      const getTripLatestDate = (trip) => {
        const days = trip.sub_segments || [];
        if (days.length === 0) {
          const dObj = parseDate(trip.acf?.datum);
          return dObj ? dObj.getTime() : 0;
        }
        const timestamps = days
          .map(d => parseDate(d.acf?.datum))
          .filter(Boolean)
          .map(d => d.getTime());

        if (timestamps.length === 0) return 0;
        return Math.max(...timestamps);
      };

      groupedTrips.sort((a, b) => {
        return getTripLatestDate(b) - getTripLatestDate(a);
      });

      setGpxStatsMap(statsMap);
      setUseky(groupedTrips);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f3e9d2] flex flex-col items-center justify-center text-slate-800 p-6 select-none">
        <Compass className="w-14 h-14 text-teal-600 animate-spin-slow mb-4" />
        <h2 className="text-xl font-bold tracking-wide text-slate-900">Stezka Českem</h2>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-semibold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
          Připravujeme cestovní deník...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-[#f3e9d2] flex flex-col items-center justify-center text-slate-800 p-6 select-none">
        <AlertTriangle className="w-14 h-14 text-rose-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold tracking-wide text-slate-900">Došlo k chybě</h2>
        <p className="text-sm text-slate-600 mt-2 text-center max-w-md font-semibold">
          {error}
        </p>
      </div>
    );
  }

  const activeTrip = useky.find(u => u.id === activeTripId);
  const activeDay = activeTrip?.sub_segments?.find(d => d.id === activeDayId);

  // Calculate dynamic bottom sheet classes for mobile viewports (height, border, shadow)
  const sidebarMobileStyleClass = activeDayId
    ? "h-[390px] border-t border-stone-200 shadow-2xl"
    : (isMobileExpanded
      ? "h-[60vh] border-t border-stone-200 shadow-2xl"
      : "h-0 border-t-0 border-transparent shadow-none"
    );

  const mobileToggleBottomClass = activeDayId
    ? "bottom-[406px]"
    : (isMobileExpanded ? "bottom-[calc(60vh+16px)]" : "bottom-4");

  return (
    <div className="h-screen w-screen relative flex flex-col md:flex-row overflow-hidden bg-[#e6dfcd] text-slate-850">

      {/* Interactive Map (100% on mobile, 2/3 width on desktop) */}
      <div className="absolute inset-0 h-full w-full md:relative md:h-full md:w-2/3 order-1 md:order-1">
        <Mapa
          useky={useky}
          activeTripId={activeTripId}
          setActiveTripId={setActiveTripId}
          activeDayId={activeDayId}
          setActiveDayId={setActiveDayId}
          hoveredTripId={hoveredTripId}
          setHoveredTripId={setHoveredTripId}
          hoveredDayId={hoveredDayId}
          setHoveredDayId={setHoveredDayId}
          isMobileExpanded={isMobileExpanded}
          onOpenHelp={() => setIsWelcomeOpen(true)}
        />

        {/* Floating Indicator when showing mock data */}
        {usingMockData && (
          <div className="absolute bottom-[88px] md:bottom-4 left-4 z-[999] px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold tracking-wide backdrop-blur-sm pointer-events-none uppercase shadow-sm">
            Offline data
          </div>
        )}
      </div>

      {/* Mobile Toggle Button (only visible on mobile, moves with sidebar Y position) */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className={`fixed right-4 z-[1001] md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-teal-700 hover:bg-teal-800 text-[#faf6ec] shadow-2xl border border-teal-900 active:scale-95 transition-all duration-300 cursor-pointer ${mobileToggleBottomClass}`}
        title={isMobileExpanded ? 'Sbalit panel' : 'Rozbalit panel'}
      >
        {isMobileExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
      </button>

      {/* Sidebar / Floating Bottom Sheet (1/3 width on desktop) */}
      <div className={`absolute bottom-0 left-0 right-0 z-[1000] md:relative md:h-full md:w-1/3 flex flex-col bg-[#f5eedc] md:border-t-0 md:border-l border-stone-200 transition-all duration-300 rounded-t-2xl md:rounded-t-none overflow-hidden order-2 md:order-2 ${sidebarMobileStyleClass}`}>
        <Sidebar
          useky={useky}
          activeTripId={activeTripId}
          setActiveTripId={setActiveTripId}
          activeDayId={activeDayId}
          setActiveDayId={setActiveDayId}
          gpxStatsMap={gpxStatsMap}
          onOpenStory={() => setIsStoryModalOpen(true)}
          resolveImageUrl={resolveImageUrl}
          isMobileExpanded={isMobileExpanded}
          setIsMobileExpanded={setIsMobileExpanded}
          setHoveredTripId={setHoveredTripId}
          setHoveredDayId={setHoveredDayId}
          onViewPhoto={handleOpenViewer}
        />
      </div>

      {/* Reader Modal (Full screen overlay dialog) */}
      <Modal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setActiveDayId(null);
        }}
        usek={activeDay}
        gpxStats={activeDayId ? gpxStatsMap[activeDayId] : null}
        resolveImageUrl={resolveImageUrl}
        onViewPhoto={handleOpenViewer}
      />

      {/* Fullscreen Image Slider/Viewer */}
      <ImageViewer
        isOpen={viewerIndex !== null}
        photos={viewerPhotos}
        currentIndex={viewerIndex}
        onClose={handleCloseViewer}
        onPrev={handlePrevPhoto}
        onNext={handleNextPhoto}
        resolveImageUrl={resolveImageUrl}
      />

      {/* Welcome / Onboarding Guide Modal */}
      {isWelcomeOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={handleCloseWelcome}
          />

          {/* Welcome Dialog Box */}
          <div className="relative w-full max-w-lg p-8 bg-[#f5eedc] border border-stone-300 rounded-3xl shadow-2xl z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 text-slate-800">
            <button
              onClick={handleCloseWelcome}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-200/50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-700/10 text-3xl animate-bounce-slow">
                🧭
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-widest">Nápověda k ovládání</span>
                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mt-1">
                  Jak si přečíst náš deník z cesty?
                </h2>
              </div>
            </div>

            {/* Instruction Body */}
            <div className="text-sm text-slate-600 space-y-4 leading-relaxed bg-[#faf6ec] border border-stone-300 rounded-2xl p-5 shadow-inner">
              <p className="text-center font-medium text-slate-800 text-base">
                Pro otevření článku z konkrétní trasy:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold shrink-0 mt-0.5">1</span>
                  <p className="text-xs">
                    Klikněte na jakýkoliv <strong>úsek trasy přímo na mapě</strong>.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold shrink-0 mt-0.5">2</span>
                  <p className="text-xs">
                    Nebo vyberte výlet ze <strong>seznamu v postranním panelu</strong>.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 text-center pt-2 italic">
                Následně se vám zobrazí seznam jednotlivých dnů, kde po rozkliknutí najdete zápisky z cest a fotogalerii.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseWelcome}
              className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-600 active:scale-98 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-md shadow-teal-700/10 hover:shadow-lg text-center"
            >
              Rozumím a chci začít
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
