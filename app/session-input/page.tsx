import { memberRepository } from "@/lib/repositories";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import SessionInputClient from "./SessionInputClient";

export default async function SessionInputPage() {
  const scopeStoreId = await getStoreScopeId();
  const initialMembers = scopeStoreId
    ? await memberRepository.getAllForStore(scopeStoreId)
    : await memberRepository.getAll();
  return <SessionInputClient initialMembers={initialMembers} />;
}
