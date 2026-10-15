import type { Metadata } from "next";
import { GuestMenuView } from "@/components/menu/guest-menu-view";
import { demoMenu } from "@/lib/demo-menu";

export const metadata: Metadata = { title: "Try a sample menu | LuxMenu", description: "Explore a sample LuxMenu digital cafe menu. Sample dishes and prices for illustration." };
export default function DemoPage({ searchParams }: { searchParams: { stage?: string } }) {
  return <GuestMenuView menu={demoMenu} walkthroughStage={searchParams.stage === "details" || searchParams.stage === "reviews" ? searchParams.stage : undefined} isPreview previewLabel="Sample menu · Dishes and prices for illustration" />;
}
