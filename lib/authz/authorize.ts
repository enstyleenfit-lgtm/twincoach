import { isSupabaseEnabled, createServerSupabase } from "@/lib/supabase/server";
import { AuthzError } from "@/lib/authz/errors";

export type ContractStatus = "active" | "trial" | "inactive" | "suspended";
export type MembershipRole = "trainer" | "owner" | "hq" | "staff";

export type StoreSummary = {
  id: string;
  name: string;
  contractStatus: ContractStatus;
};

export type StoreMembershipSummary = {
  membershipId: string;
  role: MembershipRole;
  store: StoreSummary;
};

function normalizeContractStatus(v: unknown): ContractStatus {
  if (v === "active" || v === "trial" || v === "inactive" || v === "suspended") return v;
  return "inactive";
}

function normalizeMembershipRole(v: unknown): MembershipRole {
  if (v === "trainer" || v === "owner" || v === "hq" || v === "staff") return v;
  return "staff";
}

export async function requireUser() {
  if (!isSupabaseEnabled()) {
    throw new AuthzError({
      status: 500,
      code: "BAD_REQUEST",
      message: "Supabase is not enabled; auth is required for this operation.",
    });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AuthzError({ status: 401, code: "UNAUTHENTICATED", message: "Login required." });
  }
  return { supabase, user: data.user };
}

export async function listMyStores(): Promise<StoreMembershipSummary[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_store_memberships")
    .select("id, role, store:stores(id, name, contract_status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AuthzError({ status: 500, code: "BAD_REQUEST", message: "Failed to load stores." });
  }

  return (data ?? []).map((row: any) => ({
    membershipId: String(row.id),
    role: normalizeMembershipRole(row.role),
    store: {
      id: String(row.store?.id ?? ""),
      name: String(row.store?.name ?? ""),
      contractStatus: normalizeContractStatus(row.store?.contract_status),
    },
  }));
}

export async function requireStoreAccess(params: {
  storeId: string;
  requiredRoles?: MembershipRole[];
  requireActiveOrTrial?: boolean;
}) {
  const { storeId, requiredRoles, requireActiveOrTrial = true } = params;
  if (!storeId || !storeId.trim()) {
    throw new AuthzError({ status: 400, code: "BAD_REQUEST", message: "store_id is required." });
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_store_memberships")
    .select("id, role, store:stores(id, name, contract_status)")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error || !data) {
    throw new AuthzError({ status: 403, code: "FORBIDDEN", message: "Not a member of this store." });
  }

  const role = normalizeMembershipRole((data as any).role);
  const store = (data as any).store ?? {};
  const contractStatus = normalizeContractStatus(store.contract_status);

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    throw new AuthzError({ status: 403, code: "FORBIDDEN", message: "Insufficient role." });
  }

  if (requireActiveOrTrial && !(contractStatus === "active" || contractStatus === "trial")) {
    throw new AuthzError({ status: 403, code: "FORBIDDEN", message: "Store is not contracted." });
  }

  return {
    supabase,
    user,
    membership: { id: String((data as any).id), role },
    store: { id: String(store.id ?? storeId), name: String(store.name ?? ""), contractStatus },
  };
}

