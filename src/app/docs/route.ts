import { GET as getDocs } from "../api/docs/route";

export const dynamic = "force-static";

export async function GET() {
  return getDocs();
}
