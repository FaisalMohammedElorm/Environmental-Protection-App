import { MapPin } from "lucide-react";

const markers = [
  { top: "20%", left: "18%" },
  { top: "35%", left: "52%" },
  { top: "60%", left: "30%" },
  { top: "48%", left: "72%" },
  { top: "72%", left: "60%" },
  { top: "28%", left: "84%" }
];

export function MapPreview() {
  return (
    <section className="bg-canopy-800 py-24">
      <div className="container-app grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow mb-3 block text-moss-light">Coverage</span>
          <h2 className="text-3xl font-semibold text-paper sm:text-4xl">
            Every district, one shared map
          </h2>
          <p className="mt-4 max-w-md text-canopy-200 dark:text-white-700">
            Officers and administrators see reports plotted the moment they land — clustered by
            ward, filtered by category, ranked by severity.
          </p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-canopy-600 bg-canopy-700">
          <div className="absolute inset-0 bg-contour bg-cover opacity-40 invert" aria-hidden />
          {markers.map((m, i) => (
            <MapPin
              key={i}
              className="absolute h-5 w-5 -translate-x-1/2 -translate-y-full text-alert-amber drop-shadow"
              style={{ top: m.top, left: m.left }}
              strokeWidth={2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
