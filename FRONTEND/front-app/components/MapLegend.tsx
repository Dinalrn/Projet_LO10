"use client";

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster:          "#3b82f6",
  datatourisme:          "#10b981",
  openagenda:            "#f97316",
  "data.culture.gouv.fr": "#ec4899",
};

interface Props {
  sources: string[];
  showSaved?: boolean;
  showRegistered?: boolean;
  showFriends?: boolean;
}

export function MapLegend({ sources, showSaved, showRegistered, showFriends }: Props) {
  const visibleSources = sources.filter((s) => SOURCE_COLORS[s]);
  const hasOverlays = showSaved || showRegistered || showFriends;
  if (visibleSources.length === 0 && !hasOverlays) return null;

  return (
    <div className="absolute bottom-6 right-4 z-[1000] rounded-xl border border-gray-200
                    bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm
                    dark:border-gray-700 dark:bg-gray-900/90 space-y-1">

      {/* Search result sources */}
      {visibleSources.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Sources
          </p>
          {Object.entries(SOURCE_COLORS)
            .filter(([s]) => sources.includes(s))
            .map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {name}
              </div>
            ))}
        </>
      )}

      {/* Overlay layers */}
      {hasOverlays && (
        <>
          {visibleSources.length > 0 && (
            <div className="border-t border-gray-200 pt-1 dark:border-gray-700" />
          )}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            My layers
          </p>
          {showSaved && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              Saved
            </div>
          )}
          {showRegistered && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#7c3aed" }} />
              Going
            </div>
          )}
          {showFriends && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#0d9488" }} />
              Friends going
            </div>
          )}
        </>
      )}
    </div>
  );
}
