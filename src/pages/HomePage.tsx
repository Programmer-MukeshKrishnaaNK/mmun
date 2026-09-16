import { AnnouncementsSection } from "@/components/home/AnnouncementsSection";
import { DelegateCard } from "@/components/home/DelegateCard";
import { DocumentsSection } from "@/components/home/DocumentsSection";
import { Greeting } from "@/components/home/Greeting";
import { LiveStatusCard } from "@/components/home/LiveStatusCard";
import { TodayAgenda } from "@/components/home/TodayAgenda";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Mobile reads top-to-bottom: identity → live status → today → announcements → documents.
 * Desktop splits into a main column and a sidebar (column wrappers use `contents` on mobile).
 */
export default function HomePage() {
  usePageTitle("Home");

  return (
    <>
      <Greeting />
      <div className="mt-6 flex flex-col gap-8 lg:mt-8 lg:flex-row lg:items-start">
        <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-10">
          <div className="order-2 lg:order-none">
            <LiveStatusCard />
          </div>
          <div className="order-3 lg:order-none">
            <TodayAgenda />
          </div>
          <div className="order-5 lg:order-none">
            <DocumentsSection />
          </div>
        </div>
        <div className="contents lg:sticky lg:top-24 lg:flex lg:w-[22rem] lg:shrink-0 lg:flex-col lg:gap-10">
          <div className="order-1 lg:order-none">
            <DelegateCard />
          </div>
          <div className="order-4 lg:order-none">
            <AnnouncementsSection />
          </div>
        </div>
      </div>
    </>
  );
}
