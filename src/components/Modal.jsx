import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, Share2, Compass } from 'lucide-react';

// Helper component to invalidate Leaflet size and fit bounds of day track in modal
function MiniMapController({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (coordinates && coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, { padding: [25, 25], animate: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [coordinates, map]);

  return null;
}

export default function Modal({ isOpen, onClose, usek, gpxStats, resolveImageUrl, onViewPhoto }) {
  const [animate, setAnimate] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [copied, setCopied] = useState(false);

  const handleShareDay = () => {
    if (!usek) return;
    const url = new URL(window.location.href);
    url.searchParams.set('trip', usek.parent);
    url.searchParams.set('day', usek.id);
    const shareUrl = url.toString();

    if (navigator.share) {
      navigator.share({
        title: usek.title?.rendered || 'Stezka Českem',
        text: `Koukni na zápis z cesty: ${usek.title?.rendered}`,
        url: shareUrl
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const [viewsCount, setViewsCount] = useState(null);

  useEffect(() => {
    if (isOpen && usek?.id) {
      setViewsCount(null); // Reset when loading a new segment

      const fetchViews = async () => {
        try {
          const res = await fetch(`https://api.counterapi.dev/v1/stezkaceskem-vylety/day_${usek.id}/up`);
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.value === 'number') {
              setViewsCount(data.value);
            }
          }
        } catch (err) {
          console.warn("Failed to update/fetch views count:", err);
          // Fallback to localStorage
          try {
            const localKey = `stezka_views_day_${usek.id}`;
            const current = Number(localStorage.getItem(localKey)) || 0;
            const updated = current + 1;
            localStorage.setItem(localKey, updated.toString());
            setViewsCount(updated);
          } catch {
            // ignore
          }
        }
      };

      fetchViews();
    }
  }, [isOpen, usek?.id]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  // Close on Esc key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!shouldRender || !usek) return null;

  const title = usek.title?.rendered || 'Bez názvu';
  let htmlContent = usek.content?.rendered || '';
  const absolvovano = usek.acf?.absolvovano === true;

  // Format plain text with newlines into HTML paragraphs if it lacks HTML tags
  const hasHtmlFormatting = htmlContent.includes('<p') || htmlContent.includes('<br') || htmlContent.includes('<div');
  if (htmlContent && !hasHtmlFormatting) {
    htmlContent = htmlContent
      .split(/\r?\n\r?\n/)
      .map(para => {
        const cleanPara = para.trim();
        if (!cleanPara) return '';
        return `<p>${cleanPara.replace(/\r?\n/g, '<br />')}</p>`;
      })
      .filter(Boolean)
      .join('');
  }
  const fotogalerie = usek.acf?.fotogalerie || [];

  // Get primary image
  const firstPhotoUrl = fotogalerie.length > 0
    ? resolveImageUrl(fotogalerie[0].obrazek, 0)
    : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop with soft blur */}
      <div
        className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content Wrapper (Light journal style) */}
      <div className={`relative w-full h-full sm:h-[92vh] max-w-7xl bg-[#f5eedc] border-0 sm:border border-stone-300 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>

        {/* Close Button Floating on top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-stone-300 backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-md"
          title="Zavřít (Esc)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Two-column layout grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-y-auto md:overflow-hidden">

          {/* Left Column: Info & Photos */}
          <div className="md:col-span-2 flex flex-col md:overflow-y-auto border-b md:border-b-0 md:border-r border-stone-300 bg-[#f5eedc]/50">
            {/* Header Image Hero */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden border-b border-stone-300 shrink-0">
              <img
                src={firstPhotoUrl}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="p-6 space-y-6">
              {/* Title & Badge */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2.5">
                  {absolvovano ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Absolvováno
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-200/80 text-stone-800 border border-stone-300/50">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Zatím neabsolvováno
                    </span>
                  )}
                  {usek.acf?.formattedDatum && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#faf6ec] text-stone-700 border border-stone-400">
                      📅 {usek.acf.formattedDatum}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  {title}
                </h1>
              </div>

              {/* GPX Stats Row */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#faf6ec] border border-stone-400">
                <div className="flex flex-col items-center justify-center text-center p-1.5 border-r border-stone-200">
                  <MapPin className="w-4 h-4 text-sky-600 mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vzdálenost</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5">
                    {gpxStats ? `${gpxStats.distance} km` : '...'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-1.5 border-r border-stone-200">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Nastoupáno</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5">
                    {gpxStats ? `${gpxStats.elevationGain} m` : '...'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-600 mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Sklesáno</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5">
                    {gpxStats ? `${gpxStats.elevationLoss} m` : '...'}
                  </span>
                </div>
              </div>

              {/* Mini Map showing GPX segment for this day */}
              {usek.coordinates && usek.coordinates.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-teal-700" />
                      Trasa na mapě
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">OpenStreetMap</span>
                  </div>
                  <div className="w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-stone-300 shadow-sm relative z-0">
                    <MapContainer
                      center={usek.coordinates[0] || [49.8, 15.4]}
                      zoom={11}
                      zoomControl={true}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        maxZoom={19}
                      />
                      <Polyline
                        positions={usek.coordinates}
                        pathOptions={{
                          color: absolvovano ? '#16a34a' : '#ea580c',
                          weight: 5,
                          opacity: 0.95,
                          dashArray: absolvovano ? undefined : '6, 9',
                          lineCap: 'round',
                          lineJoin: 'round'
                        }}
                      />
                      <MiniMapController coordinates={usek.coordinates} />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Polaroid photogallery on the sidebar for desktop */}
              {fotogalerie.length > 0 && (
                <div className="space-y-4 pt-2 hidden md:block">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    Fotogalerie ({fotogalerie.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {fotogalerie.map((foto, idx) => {
                      const resolvedUrl = resolveImageUrl(foto.obrazek, idx);
                      const rotateClass = idx % 2 === 0 ? 'polaroid-rotate-left' : 'polaroid-rotate-right';

                      return (
                        <div
                          key={idx}
                          onClick={() => onViewPhoto(fotogalerie, idx)}
                          className={`polaroid-card w-full ${rotateClass} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                          title="Kliknutím zvětšíte obrázek"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-stone-50 rounded-sm">
                            <img
                              src={resolvedUrl}
                              alt={foto.popisek || `Fotka ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {foto.popisek && (
                            <p className="polaroid-caption !text-lg md:!text-xl !mt-1.5 leading-tight truncate">
                              {foto.popisek}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Beautiful Reading Area */}
          <div className="md:col-span-3 flex flex-col bg-[#faf6ec] md:overflow-y-auto p-6 sm:p-12 md:p-16 lg:p-20">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 border-b border-stone-300 pb-3 tracking-tight">
                Příběh z cesty
              </h2>
              {htmlContent ? (
                <div
                  className="raw-html-content text-slate-700 text-lg leading-relaxed space-y-5"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <p className="text-slate-500 italic text-base">Tento úsek nemá zapsaný žádný příběh.</p>
              )}

              {viewsCount !== null && (
                <div className="text-xs text-slate-400/80 pt-6 flex items-center gap-1.5 border-t border-stone-300 mt-8 select-none">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  Tento příspěvek byl přečten <strong>{viewsCount}x</strong>.
                </div>
              )}

              {/* Polaroid photogallery at the end of the text for mobile */}
              {fotogalerie.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-stone-300 block md:hidden">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
                    Fotogalerie z cesty ({fotogalerie.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {fotogalerie.map((foto, idx) => {
                      const resolvedUrl = resolveImageUrl(foto.obrazek, idx);
                      const rotateClass = idx % 2 === 0 ? 'polaroid-rotate-left' : 'polaroid-rotate-right';

                      return (
                        <div
                          key={idx}
                          onClick={() => onViewPhoto(fotogalerie, idx)}
                          className={`polaroid-card w-full ${rotateClass} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                          title="Kliknutím zvětšíte obrázek"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-stone-50 rounded-sm">
                            <img
                              src={resolvedUrl}
                              alt={foto.popisek || `Fotka ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {foto.popisek && (
                            <p className="polaroid-caption !text-lg md:!text-xl !mt-1.5 leading-tight truncate">
                              {foto.popisek}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer with Close Action */}
        <div className="px-6 py-4 bg-[#f5eedc]/60 border-t border-stone-300 flex justify-between items-center shrink-0">
          <button
            onClick={handleShareDay}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white font-bold text-sm transition-all duration-300 ease-out cursor-pointer shadow-sm border min-w-[130px] ${copied
                ? 'bg-emerald-700 border-emerald-800 scale-102 shadow-emerald-700/10'
                : 'bg-teal-700 hover:bg-teal-850 border-teal-850'
              }`}
          >
            <Share2 className={`w-4 h-4 transition-transform duration-300 ${copied ? 'rotate-12 scale-110' : ''}`} />
            <span className="transition-all duration-300 ease-out">
              {copied ? 'Zkopírováno!' : 'Sdílet den'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-[#faf6ec] font-semibold text-sm transition-colors duration-200 cursor-pointer shadow-sm border border-slate-900"
          >
            Zavřít čtení
          </button>
        </div>
      </div>
    </div>
  );
}
