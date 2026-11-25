import {
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type FilterFn,
  type RowData,
  type SortFn,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import "./DataTable.css";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
});

type Features = typeof features;
type Value = string | number | null | undefined;

export interface Column<T> {
  id: string;
  header: string;
  /** Text columns are searched; numbers and dates sort as numbers and dates. */
  kind: "text" | "number" | "date";
  value: (row: T) => Value;
  /** Sort by this instead of the value, such as stages in pipeline order. */
  sortValue?: (row: T) => Value;
  /** What the cell shows. Defaults to the value, or "—" when empty. */
  cell?: (row: T) => ReactNode;
  align?: "right";
}

const isEmpty = (v: Value) => v === null || v === undefined || v === "";

// Values arrive here already normalized: empty ones are undefined, and
// sortUndefined: "last" keeps them at the bottom in both directions (R12).
const compareText: SortFn<Features, any> = (a, b, id) =>
  String(a.getValue(id)).localeCompare(String(b.getValue(id)), undefined, { sensitivity: "base", numeric: true });
const compareNumber: SortFn<Features, any> = (a, b, id) =>
  (a.getValue(id) as number) - (b.getValue(id) as number);
const compareDate: SortFn<Features, any> = (a, b, id) =>
  String(a.getValue(id)).localeCompare(String(b.getValue(id)));


interface Props<T> {
  label: string;
  columns: Column<T>[];
  data: T[];
  rowId: (row: T) => number;
  rowClassName?: (row: T) => string | undefined;
  actions?: (row: T) => ReactNode;
  empty: ReactNode;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
}

export function DataTable<T extends RowData>({ label, columns, data, rowId, rowClassName, actions, empty, searchPlaceholder = "Search", toolbar }: Props<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  /** Matches any text column, ignoring case (R11). */
  const searchText = useMemo<FilterFn<Features, T>>(
    () => (row, id, query: string) => {
      const value = byId.get(id)?.value(row.original);
      return !isEmpty(value) && String(value).toLowerCase().includes(query.trim().toLowerCase());
    },
    [byId],
  );

  const columnDefs = useMemo<ColumnDef<Features, T, any>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: c.header,
        accessorFn: (row: T) => {
          const v = (c.sortValue ?? c.value)(row);
          return isEmpty(v) ? undefined : v;
        },
        sortUndefined: "last" as const,
        sortFn: c.kind === "number" ? compareNumber : c.kind === "date" ? compareDate : compareText,
      })),
    [columns],
  );

  const table = useTable({
    features,
    columns: columnDefs,
    data,
    getRowId: (row: T) => String(rowId(row)),
    state: { globalFilter },
    onGlobalFilterChange: (updater) =>
      setGlobalFilter((old) => (typeof updater === "function" ? updater(old) : updater) ?? ""),
    globalFilterFn: searchText,
    getColumnCanGlobalFilter: (column) => byId.get(column.id)?.kind === "text",
    enableSortingRemoval: false,
  });

  const rows = table.getRowModel().rows;

  return (
    <>
      <div className="table-toolbar">
        <label className="search-box">
          <Search size={16} aria-hidden />
          <span className="visually-hidden">Search {label}</span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </label>
        {toolbar}
      </div>
      <div className="panel table-panel">
        {data.length === 0 ? (
          <div className="empty">{empty}</div>
        ) : (
          <table className="data-table" aria-label={label}>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const col = byId.get(header.column.id)!;
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={col.align === "right" ? "right" : undefined}
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      >
                        <button type="button" className="sort-button" onClick={header.column.getToggleSortingHandler()}>
                          {col.header}
                          {sorted === "asc" ? (
                            <ArrowUp size={14} aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={14} aria-hidden />
                          ) : (
                            <ChevronsUpDown size={14} aria-hidden className="sort-idle" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                  {actions && (
                    <th className="actions-col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={rowClassName?.(row.original)}>
                  {columns.map((col) => {
                    const value = col.value(row.original);
                    const shown = col.cell ? col.cell(row.original) : value;
                    return (
                      <td key={col.id} className={col.align === "right" ? "right" : undefined}>
                        {isEmpty(value) && !col.cell ? <span className="muted">—</span> : shown}
                      </td>
                    );
                  })}
                  {actions && <td className="actions-col">{actions(row.original)}</td>}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="no-match">
                    Nothing matches “{globalFilter}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/** Shows a value, or "—" when it's empty (R15). */
export function orDash(value: ReactNode) {
  return value === null || value === undefined || value === "" ? <span className="muted">—</span> : value;
}
