"use client";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  // Helper function to format path segment
  const formatPathSegment = (segment: string) => {
    // Custom mappings
    const customLabels: Record<string, string> = {
      "med-list": "Medicine Lists",
      "med-groups": "Medicine Groups",
    };

    if (customLabels[segment]) {
      return customLabels[segment];
    }

    // Check if segment looks like an ID (long string with special chars or all numbers/letters)
    const isLikelyId = segment.length > 15 || /^[a-f0-9]{8,}$/i.test(segment);

    if (isLikelyId) {
      // Truncate long IDs to first 8 characters
      return `...${segment.slice(0, 8)}`;
    }

    // Convert kebab-case or snake_case to Title Case
    return segment
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Build breadcrumb path
  const buildPath = (index: number) => {
    return "/" + paths.slice(0, index + 1).join("/");
  };

  return (
    <div className="flex items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home breadcrumb */}
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          
          {/* Show separator only if there are more paths */}
          {paths.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
          
          {/* Dynamic path breadcrumbs */}
          {paths.map((segment, index) => {
            const isLast = index === paths.length - 1;
            const label = formatPathSegment(segment);
            const href = buildPath(index);

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem className={index > 0 ? "hidden md:block" : ""}>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}