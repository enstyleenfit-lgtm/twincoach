import { memberRepository } from "@/lib/repositories";
import { sortMembersByDisplayName } from "@/lib/sortMembersByName";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  console.log("[render-check] app/members/page.tsx rendered");
  const raw = await memberRepository.getAll();
  const initialMembers = sortMembersByDisplayName(raw);
  return <MembersClient initialMembers={initialMembers} />;
}
