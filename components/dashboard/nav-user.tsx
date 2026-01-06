"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "../ui/skeleton"

type User = {
  name: string
  email: string
  avatar: string
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

 if (!user) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          disabled
          className="items-center gap-3"
        >
          {/* Avatar */}
          <Skeleton className="h-8 w-8 rounded-lg" />

          {/* Name + Email */}
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>

          {/* Dots */}
          <Skeleton className="ml-auto h-4 w-4 rounded-sm" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}



  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="items-center">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>

              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            className="w-48"
          >
            <DropdownMenuLabel>Akun</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile")}
            >
              <IconUserCircle />
              Profil
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600"
              onClick={handleLogout}
            >
              <IconLogout />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
