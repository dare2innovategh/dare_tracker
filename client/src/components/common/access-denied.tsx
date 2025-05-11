import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  message: string;
  permissionNeeded: string;
}

export default function AccessDenied({ message, permissionNeeded }: AccessDeniedProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
        Required permission: <span className="font-semibold">{permissionNeeded}</span>
      </div>
    </div>
  );
}