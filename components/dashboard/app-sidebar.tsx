"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconCalendarEvent,
  IconUsers,
  IconUserHeart,
  IconMassage,
  IconCreditCard,
  IconReportAnalytics,
  IconStar,
  IconSettings,
  IconHelp,
  IconSearch,
  IconInnerShadowTop,
  IconClock,
} from "@tabler/icons-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type User = {
  name: string
  email: string
  avatar: string
}
const data = {
  /** 🟦 MENU UTAMA */
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
   {
    title: "Booking",
    url: "/dashboard/booking",
    icon: IconCalendarEvent, // tetap kalender
  },
  {
    title: "Schedule",
    url: "/dashboard/schedule",
    icon: IconClock, // diganti icon jam supaya beda
  },
    {
      title: "Therapists",
      url: "/dashboard/therapists",
      icon: IconUserHeart,
    }
  ],

  /** 📄 DATA & LAPORAN */
  documents: [
    // {
    //   name: "Transaksi",
    //   url: "/dashboard/transactions",
    //   icon: IconCreditCard,
    // },
    // {
    //   name: "Laporan",
    //   url: "/dashboard/reports",
    //   icon: IconReportAnalytics,
    // },
    // {
    //   name: "Review & Rating",
    //   url: "/dashboard/reviews",
    //   icon: IconStar,
    // },
  ],

  /** ⚙️ SISTEM */
  navSecondary: [
    // {
    //   title: "Pengaturan",
    //   url: "/dashboard/settings",
    //   icon: IconSettings,
    // },
    // {
    //   title: "Bantuan",
    //   url: "/dashboard/help",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Pencarian",
    //   url: "/dashboard/search",
    //   icon: IconSearch,
    // },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  Yen 2 Yen
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

    </Sidebar>
  )
}
