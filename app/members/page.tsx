import { memberRepository } from "@/lib/repositories";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const initialMembers = await memberRepository.getAll();
  return <MembersClient initialMembers={initialMembers} />;
}
