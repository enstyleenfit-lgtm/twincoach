import { getAllRequests } from "@/lib/helpBoardMockData";
import { HQHelpBoardClient } from "./HQHelpBoardClient";

export default function HQHelpBoardPage() {
  const allRequests = getAllRequests();
  return <HQHelpBoardClient allRequests={allRequests} />;
}
