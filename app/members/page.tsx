import { memberRepository } from "@/lib/repositories";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  console.log("[render-check] app/members/page.tsx rendered");
  const initialMembers = await memberRepository.getAll();
  return <MembersClient initialMembers={initialMembers} />;
}
