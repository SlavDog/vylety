import { useState, useEffect } from 'react';
import { MapPin, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, Compass, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

export default function Sidebar({
  useky,
  activeTripId,
  setActiveTripId,
  activeDayId,
  setActiveDayId,
  gpxStatsMap,
  onOpenStory,
  resolveImageUrl,
  isMobileExpanded,
  setIsMobileExpanded,
  setHoveredTripId,
  setHoveredDayId,
  onViewPhoto
}) {
  const activeTrip = useky.find(u => u.id === activeTripId);
  const activeTripStats = activeTripId ? gpxStatsMap[activeTripId] : null;

  const currentDepth = activeTrip ? 1 : 0;
  const [prevDepth, setPrevDepth] = useState(currentDepth);
  const [animationClass, setAnimationClass] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShareTrip = (e) => {
    e.stopPropagation();
    if (!activeTrip) return;
    const url = new URL(window.location.href);
    url.searchParams.set('trip', activeTrip.id);
    url.searchParams.delete('day');
    const shareUrl = url.toString();

    if (navigator.share) {
      navigator.share({
        title: activeTrip.title?.rendered || 'Stezka Českem',
        text: `Koukni na výlet: ${activeTrip.title?.rendered}`,
        url: shareUrl
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (currentDepth !== prevDepth) {
    if (currentDepth > prevDepth) {
      setAnimationClass('animate-slide-right');
    } else if (currentDepth < prevDepth) {
      setAnimationClass('animate-slide-left');
    }
    setPrevDepth(currentDepth);
  }

  // Calculate global summary stats
  let totalDistance = 0;
  let completedDistance = 0;
  let totalElevationGain = 0;
  let completedElevationGain = 0;
  let totalDaysCount = 0;
  let completedDaysCount = 0;

  useky.forEach(trip => {
    const days = trip.sub_segments || [];
    if (days.length > 0) {
      totalDaysCount += days.length;
      completedDaysCount += days.filter(d => d.acf?.absolvovano === true).length;
      days.forEach(d => {
        const stats = gpxStatsMap[d.id];
        if (stats) {
          totalDistance += stats.distance || 0;
          totalElevationGain += stats.elevationGain || 0;
          if (d.acf?.absolvovano === true) {
            completedDistance += stats.distance || 0;
            completedElevationGain += stats.elevationGain || 0;
          }
        }
      });
    } else {
      // Single-route trip
      const stats = gpxStatsMap[trip.id];
      if (stats && stats.distance > 0) {
        totalDaysCount += 1;
        const isCompleted = trip.acf?.absolvovano === true;
        if (isCompleted) {
          completedDaysCount += 1;
          completedDistance += stats.distance || 0;
          completedElevationGain += stats.elevationGain || 0;
        }
        totalDistance += stats.distance || 0;
        totalElevationGain += stats.elevationGain || 0;
      }
    }
  });

  const [animatedDistance, setAnimatedDistance] = useState(0);
  const [animatedDays, setAnimatedDays] = useState(0);
  const [animatedElevation, setAnimatedElevation] = useState(0);

  const [shouldStart, setShouldStart] = useState(false);

  useEffect(() => {
    if (completedDistance === 0) return;

    // Delay animation start by 800ms to let Leaflet map and tile loading complete smoothly
    const delayId = setTimeout(() => {
      setShouldStart(true);
    }, 800);

    return () => clearTimeout(delayId);
  }, [completedDistance]);

  useEffect(() => {
    if (!shouldStart || completedDistance === 0) return;

    let start = null;
    const duration = 1200; // 1.2s smooth animation

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);

      // easeOutQuad
      const ease = percentage * (2 - percentage);

      setAnimatedDistance(Math.round(ease * completedDistance));
      setAnimatedDays(Math.round(ease * completedDaysCount));
      setAnimatedElevation(Math.round(ease * completedElevationGain));

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [shouldStart, completedDistance, completedDaysCount, completedElevationGain]);

  return (
    <div className="flex flex-col h-full bg-[#f5eedc] text-slate-800 select-none">
      {/* Mobile Drag Handle */}
      <div
        className="flex md:hidden items-center justify-center pt-2 pb-1.5 cursor-pointer bg-[#f5eedc]"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        <div className="w-10 h-1 bg-stone-300 rounded-full" />
      </div>

      {/* Conditionally render Trip Overview or General Overview */}
      {activeTrip ? (
        /* 1. TRIP OVERVIEW (Day list for specific trip) */
        <div key={`trip-overview-${activeTripId}`} className={`flex flex-col h-full ${animationClass}`}>

          {/* Back Navigation Bar */}
          <div className="p-4 border-b border-stone-300 bg-[#f5eedc]/95 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
            <button
              onClick={() => setActiveTripId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Zpět na přehled
            </button>

            <button
              onClick={handleShareTrip}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-out cursor-pointer min-w-[110px] ${copied
                ? 'text-emerald-700 font-extrabold scale-105'
                : 'text-teal-700 hover:text-teal-900'
                }`}
              title="Sdílet odkaz na tento výlet"
            >
              <Share2 className={`w-4.5 h-4.5 transition-transform duration-300 ${copied ? 'rotate-12 scale-110' : ''}`} />
              <span className="transition-all duration-300 ease-out">
                {copied ? 'Zkopírováno!' : 'Sdílet'}
              </span>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">

            {/* Trip Title & Completed Badge */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {activeTrip.acf?.absolvovano === true ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Absolvováno
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Částečně absolvováno
                  </span>
                )}
                {activeTrip.formattedDatum && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#faf6ec] text-stone-700 border border-stone-400">
                    📅 {activeTrip.formattedDatum}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTrip.title?.rendered || 'Bez názvu'}
              </h2>
            </div>

            {/* Trip Statistics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#faf6ec] border border-stone-400 rounded-xl flex flex-col justify-center items-center text-center">
                <MapPin className="w-4 h-4 text-sky-600 mb-1" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Celkem</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">
                  {activeTripStats ? `${activeTripStats.distance} km` : '...'}
                </span>
              </div>
              <div className="p-3 bg-[#faf6ec] border border-stone-400 rounded-xl flex flex-col justify-center items-center text-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Nastoupáno</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">
                  {activeTripStats ? `${activeTripStats.elevationGain} m` : '...'}
                </span>
              </div>
              <div className="p-3 bg-[#faf6ec] border border-stone-400 rounded-xl flex flex-col justify-center items-center text-center">
                <ArrowDownRight className="w-4 h-4 text-rose-600 mb-1" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sklesáno</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">
                  {activeTripStats ? `${activeTripStats.elevationLoss} m` : '...'}
                </span>
              </div>
            </div>

            {/* Trip Days List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Jednotlivé dny výletu ({activeTrip.sub_segments?.length || 0})
              </h3>

              <div className="space-y-2">
                {activeTrip.sub_segments?.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/80 text-slate-500 text-sm text-center py-8 shadow-sm">
                    Tento výlet zatím nemá žádné části.
                  </div>
                ) : (
                  activeTrip.sub_segments?.map((day) => {
                    const isCompleted = day.acf?.absolvovano === true;
                    const stats = gpxStatsMap[day.id];

                    const dayPhoto = day.acf?.fotogalerie && day.acf.fotogalerie.length > 0
                      ? resolveImageUrl(day.acf.fotogalerie[0].obrazek, 0)
                      : null;

                    const itemStyle = dayPhoto ? {
                      backgroundImage: `linear-gradient(to right, #faf6ec 40%, rgba(250, 246, 236, 0.8) 75%, rgba(250, 246, 236, 0.65) 100%), url(${dayPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : {};

                    return (
                      <div
                        key={day.id}
                        onClick={() => setActiveDayId(day.id)}
                        onMouseEnter={() => setHoveredDayId(day.id)}
                        onMouseLeave={() => setHoveredDayId(null)}
                        style={itemStyle}
                        className="p-3.5 rounded-xl bg-[#faf6ec] hover:bg-stone-50 border border-stone-400 hover:border-stone-500 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-600 ring-4 ring-emerald-500/10' : 'bg-stone-400 ring-4 ring-stone-200/30'}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                              {day.title?.rendered}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isCompleted ? 'Absolvováno' : 'Zatím neabsolvováno'}
                              {stats ? ` • ${stats.distance} km` : ''}
                              {day.acf?.formattedDatum ? ` • ${day.acf.formattedDatum}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* 3. GENERAL OVERVIEW (Main Trips list) */
        <div key="general-overview" className={`flex flex-col h-full ${animationClass}`}>
          {/* Sidebar Header (Clickable on mobile to expand/collapse) */}
          <div
            onClick={() => { if (window.innerWidth < 768) setIsMobileExpanded(!isMobileExpanded); }}
            className="px-6 py-4 md:p-6 border-b border-stone-300 bg-[#f5eedc]/95 backdrop-blur-sm sticky top-0 z-10 cursor-pointer md:cursor-default select-none flex items-center justify-between gap-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Compass className="w-4 h-4 text-teal-600 animate-spin-slow" />
                <span className="text-[9px] tracking-wider uppercase font-bold text-teal-700">Cestovatelský Deník</span>
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Stezka Českem</h2>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 hidden md:block">
                Naše společné dobrodružství kolem českých hranic
              </p>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">

            {/* Global Stats Summary Dashboard */}
            <div className="p-4 rounded-xl bg-[#faf6ec] border border-stone-400 space-y-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dosavadní Pokrok</span>

              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold text-slate-900">
                  {animatedDistance} <span className="text-sm font-semibold text-slate-500">/ {totalDistance} km</span>
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {animatedDays} dní
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                  style={{ width: `${totalDistance ? (animatedDistance / totalDistance) * 100 : 0}%` }}
                />
              </div>

              {/* Tiny sub stats row */}
              <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  {animatedElevation} m / {totalElevationGain} m celkem nastoupáno
                </span>
              </div>
            </div>


            {/* List of Trips */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Naše výlety ({useky.length})
              </h3>

              <div className="space-y-2">
                {useky.map((trip) => {
                  const isCompleted = trip.acf?.absolvovano === true;
                  const stats = gpxStatsMap[trip.id];
                  const days = trip.sub_segments || [];
                  const completedDays = days.filter(d => d.acf?.absolvovano === true).length;
                  const isSingleRouteTrip = trip.acf?.absolvovano === false && trip.acf?.gpx_soubor;

                  let tripPhoto = null;
                  const firstDay = days[0];
                  if (firstDay?.acf?.fotogalerie && firstDay.acf.fotogalerie.length > 0) {
                    tripPhoto = resolveImageUrl(firstDay.acf.fotogalerie[0].obrazek, 0);
                  } else if (trip.acf?.fotogalerie && trip.acf.fotogalerie.length > 0) {
                    tripPhoto = resolveImageUrl(trip.acf.fotogalerie[0].obrazek, 0);
                  }

                  const itemStyle = tripPhoto ? {
                    backgroundImage: `linear-gradient(to right, #faf6ec 40%, rgba(250, 246, 236, 0.8) 75%, rgba(250, 246, 236, 0.65) 100%), url(${tripPhoto})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  } : {};

                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        if (!isSingleRouteTrip) {
                          setActiveTripId(trip.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredTripId(trip.id)}
                      onMouseLeave={() => setHoveredTripId(null)}
                      style={itemStyle}
                      className={`p-3.5 rounded-xl bg-[#faf6ec] border border-stone-400 transition-all duration-200 flex items-center justify-between group ${isSingleRouteTrip
                        ? 'cursor-default select-none'
                        : 'hover:bg-stone-50 hover:border-stone-500 cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Bullet indicators based on status */}
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-600 ring-4 ring-emerald-500/10' : 'bg-stone-400 ring-4 ring-stone-200/30'}`} />
                        <div>
                          <p className={`text-sm font-semibold text-slate-800 transition-colors ${!isSingleRouteTrip && 'group-hover:text-teal-700'}`}>
                            {trip.title?.rendered}
                          </p>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {isSingleRouteTrip ? (
                              <>Zatím neabsolvováno{stats ? ` • ${stats.distance} km` : ''}</>
                            ) : (
                              <>{days.length} dní • {completedDays} / {days.length} absolvováno {stats ? ` • ${stats.distance} km` : ''}</>
                            )}
                            {trip.formattedDatum && ` • ${trip.formattedDatum}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isSingleRouteTrip && (
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
