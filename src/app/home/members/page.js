import { getMembers, getCollectiveStats } from "@/lib/opencollective";

export default async function MembersPage() {
  const [members, stats] = await Promise.all([
    getMembers(100).catch(() => []),
    getCollectiveStats().catch(() => null),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Members</h1>
      {stats && (
        <p className="text-foreground/60 mb-8">
          {stats.memberCount} members and counting.
        </p>
      )}

      {members.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.slug}
              className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-white p-3"
            >
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt=""
                  className="w-10 h-10 rounded-full bg-foreground/5"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {member.name?.charAt(0) || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <p className="text-xs text-foreground/40">
                  Joined {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-foreground/50">
          Member list will appear once the Open Collective API is connected.
        </p>
      )}
    </div>
  );
}
