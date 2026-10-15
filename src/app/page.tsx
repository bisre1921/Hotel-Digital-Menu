import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
export const metadata: Metadata = {
  title: "LuxMenu — Good food. Great first impressions.",
  description: "A menu worth opening. Create a beautiful digital menu for your cafe, restaurant or hotel, review imported dishes, and share it with one permanent QR code. Built with Ethiopian hospitality in mind.",
};
export default function HomePage() { return <LandingPage />; }
