import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Info, X, BookOpen, HelpCircle, Layers, Check } from 'lucide-react';

// Mapové podklady s podporou OpenStreetMap s vyznačením hor a obcí
const TILE_LAYERS = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    desc: 'Klasická OpenStreetMap s vyznačením hor, městeček a tras',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  voyager: {
    id: 'voyager',
    name: 'Světlá cestovatelská',
    desc: 'Čistá světlá podkladová mapa',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }
};


// Helper component to center and zoom map to segment coordinates
function MapController({ activeTrack, activeTripId, activeDayId, isMobileExpanded }) {
  const map = useMap();

  useEffect(() => {
    if (activeTrack && activeTrack.coordinates && activeTrack.coordinates.length > 0) {
      const bounds = L.latLngBounds(activeTrack.coordinates);

      const isMobile = window.innerWidth < 768;
      let paddingBottom = 60;
      let paddingTop = 60;

      if (isMobile) {
        if (activeDayId) {
          paddingBottom = 410;
          paddingTop = 40;
        } else if (activeTripId) {
          paddingBottom = Math.round(window.innerHeight * 0.60) + 20;
          paddingTop = 40;
        } else if (isMobileExpanded) {
          paddingBottom = Math.round(window.innerHeight * 0.60) + 20;
          paddingTop = 40;
        } else {
          paddingBottom = 40;
          paddingTop = 40;
        }
      }

      map.fitBounds(bounds, {
        paddingTopLeft: [isMobile ? 25 : 60, paddingTop],
        paddingBottomRight: [isMobile ? 25 : 60, paddingBottom],
        maxZoom: 12,
        animate: true,
        duration: 1.2
      });
    }
  }, [activeTrack, activeTripId, activeDayId, isMobileExpanded, map]);

  return null;
}

export default function Mapa({
  useky,
  activeTripId,
  setActiveTripId,
  activeDayId,
  setActiveDayId,
  hoveredTripId,
  setHoveredTripId,
  hoveredDayId,
  setHoveredDayId,
  isMobileExpanded,
  onOpenHelp
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);
  const [activeTileKey, setActiveTileKey] = useState('osm'); // Výchozí: OpenStreetMap s vyznačením hor a obcí

  // Center of Czech Republic
  const centerOfCR = [49.8175, 15.4730];
  const defaultZoom = 7.5;

  // Memoize all tracks coordinates so reference doesn't change on hover states
  const allTracks = useMemo(() => ({
    coordinates: useky.flatMap(trip => trip.coordinates || [])
  }), [useky]);

  const activeTrip = useky.find(u => u.id === activeTripId);
  const activeDay = activeTrip?.sub_segments?.find(d => d.id === activeDayId);
  const activeTrack = activeDay || activeTrip || allTracks;

  const activeTileLayer = TILE_LAYERS[activeTileKey] || TILE_LAYERS.osm;

  return (
    <div className="w-full h-full relative">

      {/* Interactive Map Container */}
      <MapContainer
        center={centerOfCR}
        zoom={defaultZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        {/* Dynamic Tile Layer (Turistická / OpenTopoMap s názvy hor v podkladu / CyclOSM / Voyager) */}
        <TileLayer
          key={activeTileLayer.id}
          url={activeTileLayer.url}
          attribution={activeTileLayer.attribution}
          maxZoom={activeTileLayer.maxZoom}
        />

        {/* Custom Zoom Controls placed bottom-right for clean mobile UI */}
        <div className="leaflet-bottom leaflet-right z-[1000] p-4 hidden sm:block">
          <div className="leaflet-bar border border-slate-200/80 rounded-lg overflow-hidden shadow-md">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); L.Map.prototype.zoomIn.call(e.currentTarget._map || L.map); }}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors"
              title="Přiblížit"
            >
              +
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); L.Map.prototype.zoomOut.call(e.currentTarget._map || L.map); }}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors"
              title="Oddálit"
            >
              -
            </a>
          </div>
        </div>

        {/* Draw GPX segment Polylines */}
        {useky.map((trip) => {
          const isSingleRouteTrip = trip.acf?.absolvovano === false && trip.acf?.gpx_soubor;
          const renderSegments = isSingleRouteTrip ? [trip] : (trip.sub_segments || []);

          return renderSegments.map((dayOrTrip, idx) => {
            if (!dayOrTrip.coordinates || dayOrTrip.coordinates.length === 0) return null;

            const isDayCompleted = dayOrTrip.acf?.absolvovano === true;
            const isTripActive = trip.id === activeTripId;
            const isDayActive = isSingleRouteTrip ? false : (isTripActive && dayOrTrip.id === activeDayId);

            // Styling parameters - High contrast colors for topographic map visibility
            let color = '';
            let weight = 5;
            let opacity = 1.0;
            let dashArray = isDayCompleted ? undefined : '6, 9';

            const isTripHovered = hoveredTripId === trip.id;
            const isDayHovered = isSingleRouteTrip ? false : (hoveredDayId === dayOrTrip.id);

            if (activeTripId === null) {
              // 1. General Overview
              if (isDayCompleted) {
                color = isTripHovered ? '#22c55e' : '#15803d'; // Vibrant green on hover, rich forest green normally
              } else {
                color = isTripHovered ? '#f97316' : '#ea580c'; // Vibrant bright orange on hover, solid amber orange normally
              }
              weight = isTripHovered ? 7 : 5;
              opacity = 1.0;
            } else if (isTripActive) {
              // 2. Active Trip
              if (isDayCompleted) {
                color = idx % 2 === 0 ? '#14532d' : '#16a34a'; // Alternating deep forest (#14532d) & rich emerald green (#16a34a)
              } else {
                color = idx % 2 === 0 ? '#ea580c' : '#f97316'; // Alternating vivid amber & bright orange
              }

              if (isDayActive) {
                color = isDayCompleted ? '#0d9488' : '#c2410c'; // Teal accent for active completed day, Deep Coral for uncompleted
                weight = 9;
                dashArray = undefined; // Solid line for active highlight
              } else if (isDayHovered) {
                weight = 8;
              } else {
                weight = 5;
              }
              opacity = 1.0;
            } else {
              // 3. Faded inactive trips
              color = isDayCompleted ? '#16a34a' : '#d97706';
              weight = 3;
              opacity = 0.3;
            }

            return (
              <Polyline
                key={dayOrTrip.id}
                positions={dayOrTrip.coordinates}
                color={color}
                weight={weight}
                opacity={opacity}
                dashArray={dashArray}
                pathOptions={{
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  dashArray: dashArray,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  click: () => {
                    if (isSingleRouteTrip) return;

                    if (activeTripId === null) {
                      setActiveTripId(trip.id);
                    } else if (isTripActive) {
                      setActiveDayId(dayOrTrip.id);
                    } else {
                      setActiveTripId(trip.id);
                      setActiveDayId(null);
                    }
                  },
                  mouseover: () => {
                    if (activeTripId === null) {
                      setHoveredTripId(trip.id);
                    } else if (isTripActive && !isSingleRouteTrip) {
                      setHoveredDayId(dayOrTrip.id);
                    }
                  },
                  mouseout: () => {
                    if (activeTripId === null) {
                      setHoveredTripId(null);
                    } else if (isTripActive && !isSingleRouteTrip) {
                      setHoveredDayId(null);
                    }
                  }
                }}
              >
                <Tooltip sticky direction="top">
                  {activeTripId === null
                    ? (trip.title?.rendered || 'Bez názvu')
                    : (dayOrTrip.title?.rendered || 'Bez názvu')}
                </Tooltip>
              </Polyline>
            );
          });
        })}

        {/* Map positioning controller */}
        <MapController
          activeTrack={activeTrack}
          activeTripId={activeTripId}
          activeDayId={activeDayId}
          isMobileExpanded={isMobileExpanded}
        />
      </MapContainer>

      {/* Floating Controls Top Left */}
      <div className="absolute top-4 left-4 z-[999] flex gap-2 items-center flex-wrap max-w-[calc(100%-2rem)]">
        {/* Floating Project Info Button */}
        <button
          onClick={() => setIsInfoOpen(true)}
          className="p-3 rounded-full bg-white/95 border border-stone-200/80 text-teal-700 hover:text-teal-650 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="O projektu"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* Floating Help Guide Button */}
        <button
          onClick={onOpenHelp}
          className="p-3 rounded-full bg-white/95 border border-stone-200/80 text-teal-700 hover:text-teal-650 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="Nápověda k ovládání"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
            className="px-4 py-2.5 rounded-full bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-teal-900"
            title="Změnit mapový podklad / OpenStreetMap"
          >
            <Layers className="w-4 h-4" />
            <span>Výběr mapy</span>
          </button>

          {/* Layer Selection Dropdown Menu */}
          {isLayersMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-2 z-[10000] animate-zoom-in-dialog">
              <div className="px-3 py-2 border-b border-stone-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mapový podklad</span>
                <button
                  onClick={() => setIsLayersMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 py-1">
                {Object.values(TILE_LAYERS).map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      setActiveTileKey(layer.id);
                      setIsLayersMenuOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                      activeTileKey === layer.id
                        ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      activeTileKey === layer.id ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'
                    }`}>
                      {activeTileKey === layer.id && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{layer.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{layer.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Book Promo Button */}
        <button
          onClick={() => setIsBookOpen(true)}
          className="px-4 py-2.5 rounded-full bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-teal-900"
          title="Kupte si mou knihu"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Kupte si mou knihu</span>
        </button>
      </div>

      {/* Custom Info Overlay Dialog */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs animate-fade-in-backdrop"
            onClick={() => setIsInfoOpen(false)}
          />

          {/* Info Dialog Box */}
          <div className="relative w-full max-w-md p-6 bg-[#f5eedc] border border-stone-200 rounded-2xl shadow-2xl z-10 flex flex-col gap-4 animate-zoom-in-dialog text-slate-800">
            <button
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-200/50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-stone-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/10 text-lg">
                🌲
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Naše Stezka Českem</h2>
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">El & Ála</span>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Vítejte v našem cestovatelském deníku! Tato stránka mapuje naši společnou cestu po <strong>Stezce Českem</strong> – první oficiální pěší trase vedoucí podél hranic České republiky.
              </p>
              <p>
                Kliknutím na jednotlivé <strong>úseky trasy na mapě</strong> si můžete zobrazit informace o konkrétní trase a přečíst si zápisky z našich dobrodružství.
              </p>
              <p className="text-xs text-teal-800 bg-teal-50/80 p-2.5 rounded-xl border border-teal-100">
                💡 <strong>Tip:</strong> Pomocí tlačítka <strong>Mapa</strong> v horní liště si můžete přepnout podklad na <em>OpenStreetMap</em> pro zobrazení názvů hor, obcí a cest.
              </p>
            </div>

            <button
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-semibold text-sm transition-all duration-200 mt-2 cursor-pointer shadow-sm"
            >
              Zavřít informace
            </button>
          </div>
        </div>
      )}

      {/* Custom Book Promo Overlay Dialog */}
      {isBookOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs animate-fade-in-backdrop"
            onClick={() => setIsBookOpen(false)}
          />

          {/* Book Dialog Box */}
          <div className="relative w-full max-w-md p-6 bg-[#f5eedc] border border-stone-200 rounded-2xl shadow-2xl z-10 flex flex-col gap-4 animate-zoom-in-dialog text-slate-800">
            <button
              onClick={() => setIsBookOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-200/50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-stone-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/10 text-lg">
                📚
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Knižní Tip</h2>
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">MUDr. Alena Hamplová</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 py-2">
              <img
                src="/book_cover.png"
                alt="Kniha Domácí lékař"
                className="w-36 h-36 object-cover rounded border border-stone-300 mx-auto sm:mx-0 shrink-0 shadow-md"
              />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  Jsem autorkou knižní série Domácí lékař!
                </h4>
                <p className="text-[11px] text-slate-655 mt-2 leading-relaxed">
                  Chcete vědět po čem sáhnout, když vás začne trápit kašel, chřipka, rýma, bolesti v krku či horečka? Případně co dělat, abyste tyto choroby vůbec nedostali? Pak bych vám ráda doporučila svou knižní sérii Domácí lékař.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <a
                href="https://mudr-alena-hamplova.cz/jak-sam-bez-cizi-pomoci-zvladnout-bezne-nemoci/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-[#faf6ec] font-bold text-xs transition-colors duration-200 cursor-pointer border border-teal-900 text-center"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                Domácí lékař I
              </a>
              <a
                href="https://mudr-alena-hamplova.cz/domaci-lekar-ii/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-[#faf6ec] font-bold text-xs transition-colors duration-200 cursor-pointer border border-teal-900 text-center"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                Domácí lékař II
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

