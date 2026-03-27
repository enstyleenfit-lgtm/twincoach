import StoreDetailPage from "@/app/stores/[storeName]/page";

interface StoreDetailByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreDetailByIdPage({ params }: StoreDetailByIdPageProps) {
  const { id } = await params;
  return StoreDetailPage({ params: Promise.resolve({ storeName: id }) });
}
