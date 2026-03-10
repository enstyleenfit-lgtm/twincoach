import Link from "next/link";
import { members } from "@/lib/mockData";
import { Member } from "@/types";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

export default function MembersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">Members</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Last Visit
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Visit Interval
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Risk Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Intervention Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                      >
                        {member.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{member.plan}</td>
                    <td className="px-6 py-4 text-zinc-300">
                      {member.lastVisitDate}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {member.visitInterval}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${getRiskScoreColor(
                          member.riskScore
                        )}`}
                      >
                        {member.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {member.interventionStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}

