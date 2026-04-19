"use client";

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: "#3b82f6",
  datatourisme: "#10b981",
  openagenda: "#f97316",
  "data.culture.gouv.fr": "#ec4899",
};

export function MapLegend({ sources }: { sources: string[] }) {
  const visible = sources.filter((s) => SOURCE_COLORS[s]);
  if (visible.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-4 z-[1000] rounded-xl border border-gray-200
                    bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm
                    dark:border-gray-700 dark:bg-gray-900/90">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Sources
      </p>
      {Object.entries(SOURCE_COLORS)
        .filter(([s]) => sources.includes(s))
        .map(([name, color]) => (
          <div key={name} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {name}
          </div>
        ))}
    </div>
  );
}
