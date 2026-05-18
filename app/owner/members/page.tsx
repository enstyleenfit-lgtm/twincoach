import { memberRepository } from "@/lib/repositories";
import { sortMembersByDisplayName } from "@/lib/sortMembersByName";
import { OWNER_STORE_IDS, getTrialStoreNameForData } from "@/lib/trialStore";
import MembersClient from "@/app/members/MembersClient";

export default async function OwnerMembersPage() {
  const membersByStore = await Promise.all(
    OWNER_STORE_IDS.map((id) =>
      memberRepository.getAllForStore(getTrialStoreNameForData(id))
    )
  );
  const initialMembers = sortMembersByDisplayName(membersByStore.flat());
  return <MembersClient initialMembers={initialMembers} />;
}
