"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    color?: string;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  const isActive = (url: string, hasChildren: boolean) => {
    if (hasChildren) {
      return pathname.startsWith(url);
    }
    return pathname === url;
  };

  const isSubItemActive = (url: string) => {
    return pathname === url;
  };

  const getColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      "blue-500": "text-blue-500 hover:text-blue-600",
      "green-500": "text-green-500 hover:text-green-600",
      "purple-500": "text-purple-500 hover:text-purple-600",
      "orange-500": "text-orange-500 hover:text-orange-600",
      "cyan-500": "text-cyan-500 hover:text-cyan-600",
      "red-500": "text-red-500 hover:text-red-600",
    };
    return color ? colorMap[color] || "" : "";
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const itemIsActive = isActive(item.url, !!item.items?.length);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={itemIsActive || item.isActive}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={itemIsActive}
                  className="transition-colors duration-150"
                >
                  <a href={item.url}>
                    <item.icon className={getColorClass(item.color)} />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform duration-150">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubItemActive(subItem.url)}
                              className="transition-colors duration-150"
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
