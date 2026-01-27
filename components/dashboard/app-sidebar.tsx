"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconCalendarEvent,
  IconUsers,
  IconUserHeart,
  IconInnerShadowTop,
  IconClock,
  IconMapPin,
  IconBriefcase,
} from "@tabler/icons-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

const data = {
  /** 🟦 MENU UTAMA */
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
   {
    title: "Bookings",
    url: "/dashboard/bookings",
    icon: IconCalendarEvent, // tetap kalender
  },
  {
    title: "Schedule",
    url: "/dashboard/schedule",
    icon: IconClock, // diganti icon jam supaya beda
  },
  {
    title: "Positions",
    url: "/dashboard/locations",
    icon: IconMapPin,
  },
  {
    title: "Services",
    url: "/dashboard/services",
    icon: IconBriefcase,
  },
    {
      title: "Therapists",
      url: "/dashboard/therapists",
      icon: IconUserHeart,
    },
    {
      title: "Patients",
      url: "/dashboard/patients",
      icon: IconUsers,
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

// AppSidebar.tsx
export function AppSidebar({
  user, // Menerima user sebagai prop
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: { name: string; email: string; avatar: string } }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Yen 2 Yen</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <NavUser user={user} /> {/* Meneruskan user ke NavUser */}
      </SidebarFooter>
    </Sidebar>
  )
}
