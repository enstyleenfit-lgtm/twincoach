import Link from "next/link";
import { getMemberById, getVisitsByMemberId, getInterventionsByMemberId } from "@/lib/mockData";
import { Visit, Intervention } from "@/types";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = getMemberById(id);
  const visitHistory = getVisitsByMemberId(id);
  const interventionHistory = getInterventionsByMemberId(id);

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link
          href="/members"
          className="text-blue-400 hover:text-blue-300 hover:underline mb-4 inline-block"
        >
          ← Back to Members
        </Link>
        <h1 className="text-4xl font-bold mb-8">Member Not Found</h1>
        <p className="text-zinc-400">The member with ID "{id}" could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link
        href="/members"
        className="text-blue-400 hover:text-blue-300 hover:underline mb-6 inline-block"
      >
        ← Back to Members
      </Link>

      <h1 className="text-4xl font-bold mb-8">{member.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Member Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm">Name</label>
              <p className="text-white font-medium">{member.name}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Plan</label>
              <p className="text-white">{member.plan}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Join Date</label>
              <p className="text-white">{member.joinDate}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Last Visit</label>
              <p className="text-white">{member.lastVisitDate}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Risk Score</label>
              <p className={`text-2xl font-bold ${getRiskScoreColor(member.riskScore)}`}>
                {member.riskScore}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Intervention & Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm">Recommended Intervention</label>
              <p className="text-white">{member.recommendedIntervention}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Notes</label>
              <p className="text-white text-sm leading-relaxed">{member.notes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Visit History</h2>
          <div className="space-y-4">
            {visitHistory.length > 0 ? (
              visitHistory.map((visit) => (
                <div
                  key={visit.id}
                  className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-white font-medium">Visit</span>
                    <span className="text-zinc-400 text-sm">{visit.visitDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-sm">No visit history available</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Intervention History</h2>
          <div className="space-y-4">
            {interventionHistory.length > 0 ? (
              interventionHistory.map((intervention) => (
                <div
                  key={intervention.id}
                  className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium">{intervention.type}</span>
                    <span className="text-zinc-400 text-sm">{intervention.createdAt}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-green-400 text-xs font-medium">
                      {intervention.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-sm">No intervention history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
