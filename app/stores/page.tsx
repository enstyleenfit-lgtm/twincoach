import { memberRepository } from "@/lib/repositories";
import StoresClient from "./StoresClient";

export default async function StoresPage() {
  const initialMembers = await memberRepository.getAll();
  return <StoresClient initialMembers={initialMembers} />;
}
