import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Info, X } from 'lucide-react';


// Helper component to center and zoom map to segment coordinates
// Helper component to center and zoom map to segment coordinates
function MapController({ activeTrack, activeTripId, activeDayId }) {
  const map = useMap();

  useEffect(() => {
    if (activeTrack && activeTrack.coordinates && activeTrack.coordinates.length > 0) {
      const bounds = L.latLngBounds(activeTrack.coordinates);

      const isMobile = window.innerWidth < 768;
      let paddingBottom = 60;
      let paddingTop = 60;

      if (isMobile) {
        if (activeDayId) {
          // Day detail sidebar height is 390px
          paddingBottom = 410;
          paddingTop = 40;
        } else if (activeTripId) {
          // Trip day list sidebar height is 65vh
          paddingBottom = Math.round(window.innerHeight * 0.65) + 20;
          paddingTop = 40;
        } else {
          // General overview collapsed sidebar height is 74px
          paddingBottom = 90;
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
  }, [activeTrack, activeTripId, activeDayId, map]);

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
  setHoveredDayId
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Center of Czech Republic
  const centerOfCR = [49.8175, 15.4730];
  const defaultZoom = 7.5;

  const activeTrip = useky.find(u => u.id === activeTripId);
  const activeDay = activeTrip?.sub_segments?.find(d => d.id === activeDayId);
  const activeTrack = activeDay || activeTrip;

  return (
    <div className="w-full h-full relative">

      {/* Interactive Map Container */}
      <MapContainer
        center={centerOfCR}
        zoom={defaultZoom}
        zoomControl={false} // Disable standard top-left controls to place custom controls later
        className="w-full h-full"
      >
        {/* Premium Light Travel Map Tile Layer (CartoDB Voyager) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Custom Zoom Controls placed bottom-right for clean mobile UI */}
        <div className="leaflet-bottom leaflet-right z-[1000] p-4 hidden sm:block">
          <div className="leaflet-bar border border-slate-200/80 rounded-lg overflow-hidden">
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

            // Styling parameters
            let color = '';
            let weight = 4.5;
            let opacity = 1.0;
            let dashArray = isDayCompleted ? undefined : '5, 8';

            const isTripHovered = hoveredTripId === trip.id;
            const isDayHovered = isSingleRouteTrip ? false : (hoveredDayId === dayOrTrip.id);

            if (activeTripId === null) {
              // 1. General Overview: render trips as single units with solid opacity
              if (isDayCompleted) {
                color = isTripHovered ? '#22c55e' : '#15803d'; // Vibrant green on hover, rich forest green normally
              } else {
                color = isTripHovered ? '#a8a29e' : '#78716c'; // Lighter stone on hover, slate-stone normally
              }
              weight = isTripHovered ? 6 : 4.5;
              opacity = 1.0;
            } else if (isTripActive) {
              // 2. Active Trip: draw days with alternating colors and highlight hover/active
              if (isDayCompleted) {
                color = idx % 2 === 0 ? '#14532d' : '#22c55e'; // Deep forest moss (#14532d) vs bright grass green (#22c55e)
              } else {
                color = idx % 2 === 0 ? '#374151' : '#9ca3af'; // Dark charcoal (#374151) vs light silver gray (#9ca3af)
              }

              if (isDayActive) {
                color = isDayCompleted ? '#0d9488' : '#1e293b'; // Teal accent for active completed day, Dark Slate for uncompleted
                weight = 8.5;
                dashArray = undefined; // Solid line for active highlight
              } else if (isDayHovered) {
                weight = 7.5; // Keep base color, make line thicker
              } else {
                weight = 4.5; // Default thickness
              }
              opacity = 1.0;
            } else {
              // 3. Faded inactive trips
              color = isDayCompleted ? '#16a34a' : '#78716c';
              weight = 2.5;
              opacity = 0.2;
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
                  dashArray: dashArray
                }}
                eventHandlers={{
                  click: () => {
                    if (isSingleRouteTrip) return; // Do not allow clicking/selecting uncompleted parent trips

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
        />
      </MapContainer>

      {/* Floating Project Info Button */}
      <button
        onClick={() => setIsInfoOpen(true)}
        className="absolute top-4 left-4 z-[999] p-3 rounded-full bg-white/95 border border-stone-200/80 text-teal-700 hover:text-teal-600 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
        title="O projektu"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Custom Info Overlay Dialog */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsInfoOpen(false)}
          />

          {/* Info Dialog Box */}
          <div className="relative w-full max-w-md p-6 bg-[#f5eedc] border border-stone-200 rounded-2xl shadow-2xl z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
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

    </div>
  );
}
