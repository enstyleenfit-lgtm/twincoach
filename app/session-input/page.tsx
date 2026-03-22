import { memberRepository } from "@/lib/repositories";
import SessionInputClient from "./SessionInputClient";

export default async function SessionInputPage() {
  const initialMembers = await memberRepository.getAll();
  return <SessionInputClient initialMembers={initialMembers} />;
}
