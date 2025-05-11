import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { RefreshButton } from "@/components/ui/refresh-button";

interface BackButtonProps {
  label: string;
  href: string;
}

interface HeaderProps {
  title: string;
  description?: string;
  showActions?: boolean;
  onAddNew?: () => void;
  onFilter?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  addNewText?: string;
  backButton?: BackButtonProps;
  actions?: React.ReactNode;
}

export default function Header({
  title,
  description,
  showActions = true,
  onAddNew,
  onFilter,
  onRefresh,
  isRefreshing = false,
  addNewText = "Add New",
  backButton,
  actions
}: HeaderProps) {
  return (
    <div className="mb-6">
      {backButton && (
        <div className="mb-4">
          <Link href={backButton.href}>
            <Button variant="ghost" size="sm" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButton.label}
            </Button>
          </Link>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {(showActions || actions) && (
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {actions}
            {!actions && (
              <>
                {onRefresh && (
                  <RefreshButton 
                    onRefresh={onRefresh}
                    variant="outline"
                    size="sm"
                    label="Refresh"
                    className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 bg-white text-gray-700 font-medium"
                  />
                )}
                {onFilter && (
                  <Button variant="outline" size="sm" onClick={onFilter}>
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                )}
                {onAddNew && (
                  <Button onClick={onAddNew} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>{addNewText}</span>
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
