import showcaseItems from "@/data/showcase.json";

export default function ShowcasePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Showcase</h1>
      <p className="text-foreground/60 mb-8">
        Demos, designs, and work-in-progress from the community.
      </p>

      {showcaseItems.length > 0 ? (
        <div className="space-y-4">
          {showcaseItems.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-foreground/10 bg-white p-6"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-display text-lg font-bold">{item.title}</h2>
                <span className="text-xs text-foreground/40">{item.date}</span>
              </div>
              <p className="text-sm text-foreground/70 mb-3">
                {item.description}
              </p>
              <p className="text-xs text-foreground/40 mb-3">
                By {item.author}
              </p>
              <div className="flex gap-4">
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View →
                  </a>
                )}
                {item.discussion && (
                  <a
                    href={item.discussion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/50 hover:text-foreground"
                  >
                    Discuss →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-foreground/50">No showcase items yet.</p>
      )}
    </div>
  );
}
