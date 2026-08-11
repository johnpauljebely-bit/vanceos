import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export function DataTable({
  columns,
  children,
  isEmpty,
  className,
}: {
  columns: string[];
  children?: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="bg-surface text-fg-muted">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-2 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                <div className="flex flex-col items-center justify-center gap-2 text-fg-muted">
                  <AlertTriangle size={20} className="opacity-60" />
                  <span className="text-sm">No Data</span>
                </div>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-border-subtle">{children}</tr>;
}

export function DataCell({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-4 py-2", className)}>{children}</td>;
}
