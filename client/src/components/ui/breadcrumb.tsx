import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { Link } from "wouter"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ className, ...props }, ref) => (
  <nav 
    ref={ref} 
    aria-label="breadcrumb" 
    className={cn("flex", className)}
    {...props} 
  />
))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentPropsWithoutRef<"a">, "href"> & { 
    href?: string;
    asChild?: boolean;
  }
>(({ className, asChild = false, href, children, ...props }, ref) => {
  if (href) {
    return (
      <Link href={href}>
        <span
          className={cn("transition-colors hover:text-foreground text-sm text-muted-foreground", className)}
          {...props}
        >
          {children}
        </span>
      </Link>
    )
  }
  
  return (
    <span
      className={cn("text-sm font-medium", className)}
      {...props}
    >
      {children}
    </span>
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbSeparator = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) => (
  <span
    className={cn("mx-2 text-muted-foreground", className)}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </span>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) => (
  <span
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}