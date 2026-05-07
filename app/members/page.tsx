import { memberRepository } from "@/lib/repositories";
import { sortMembersByDisplayName } from "@/lib/sortMembersByName";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const scopeStoreId = await getStoreScopeId();
  const raw = scopeStoreId
    ? await memberRepository.getAllForStore(scopeStoreId)
    : await memberRepository.getAll();
  const initialMembers = sortMembersByDisplayName(raw);
  return <MembersClient initialMembers={initialMembers} />;
}
