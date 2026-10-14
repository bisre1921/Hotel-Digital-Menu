import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GuestMenuView } from "@/components/menu/guest-menu-view";

interface Props {
  params: { slug: string };
  searchParams: { preview?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const menu = await db.menu.findUnique({
    where: { slug: params.slug },
    include: { hotel: true },
  });

  if (!menu) {
    return {
      title: "Menu Not Found | LuxMenu",
    };
  }

  return {
    title: `${menu.title} | ${menu.hotel.name}`,
    description: menu.description || `Digital culinary menu for ${menu.hotel.name}`,
    openGraph: {
      title: `${menu.title} - ${menu.hotel.name}`,
      description: menu.description || undefined,
      images: menu.headerImageUrl || menu.hotel.coverImageUrl ? [menu.headerImageUrl || menu.hotel.coverImageUrl!] : [],
    },
  };
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const isPreview = searchParams.preview === "true";

  const menu = await db.menu.findUnique({
    where: { slug: params.slug },
    include: {
      hotel: true,
      categories: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!menu) {
    notFound();
  }

  // If unpublished, verify if preview is authorized by hotel tenant
  if (!menu.isPublished) {
    if (!isPreview) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground text-center">
          <div className="max-w-md p-8 rounded-3xl border border-border bg-card shadow-luxury">
            <h2 className="font-serif text-2xl font-medium mb-2">Menu Currently Unavailable</h2>
            <p className="text-sm text-muted-foreground">
              This menu is currently being prepared or updated by the hotel culinary team. Please check back shortly.
            </p>
          </div>
        </div>
      );
    }

    const session = await getSession();
    if (!session || session.hotelId !== menu.hotelId) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground text-center">
          <div className="max-w-md p-8 rounded-3xl border border-destructive/40 bg-card shadow-luxury">
            <h2 className="font-serif text-2xl font-medium text-destructive mb-2">Unauthorized Preview</h2>
            <p className="text-sm text-muted-foreground">
              You must be logged into the hotel administrator dashboard to preview unpublished draft menus.
            </p>
          </div>
        </div>
      );
    }
  }

  return <GuestMenuView menu={menu as any} isPreview={isPreview} />;
}
