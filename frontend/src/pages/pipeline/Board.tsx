import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useRef, useState } from "react";
import { useDealForm } from "../../components/DealFormContext";
import { useToast } from "../../components/Toast";
import { useMoveDeal } from "../../hooks/deals";
import { columnOf } from "../../lib/move";
import { STAGES, STAGE_BY_ID } from "../../lib/rules";
import type { Deal, Stage } from "../../lib/types";
import { Column } from "./Column";
import { CardBody } from "./DealCard";

type Columns = Record<Stage, number[]>;

function group(deals: Deal[]): Columns {
  return Object.fromEntries(STAGES.map((s) => [s.id, columnOf(deals, s.id).map((d) => d.id)])) as Columns;
}

const COLUMN_PREFIX = "column:";

export function Board({ deals }: { deals: Deal[] }) {
  const openDealForm = useDealForm();
  const toast = useToast();
  const move = useMoveDeal(toast);
  const byId = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const settled = useMemo(() => group(deals), [deals]);

  // While a card is dragged, the columns follow the pointer here; the cache
  // changes only when the card is dropped.
  const [dragging, setDragging] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const origin = useRef<{ stage: Stage; index: number } | null>(null);
  // Where a card picked up with the keyboard is now.
  const keyboardAt = useRef<{ stage: Stage; index: number } | null>(null);
  const columns = dragging ?? settled;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  /** Arrow keys move a picked-up card: Left and Right to the same place in the
   * next column, Up and Down one place within its column (R31). */
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, { active, context }) => {
    const at = keyboardAt.current;
    if (!at || !context.collisionRect) return undefined;
    const order = STAGES.map((s) => s.id);
    let stage = at.stage;
    let index = at.index;
    if (event.code === KeyboardCode.Right || event.code === KeyboardCode.Left) {
      const next = order.indexOf(stage) + (event.code === KeyboardCode.Right ? 1 : -1);
      if (next < 0 || next >= order.length) return undefined;
      stage = order[next];
      index = Math.min(index, columnsRef.current[stage].length);
    } else if (event.code === KeyboardCode.Down || event.code === KeyboardCode.Up) {
      index += event.code === KeyboardCode.Down ? 1 : -1;
      if (index < 0 || index >= columnsRef.current[stage].length) return undefined;
    } else {
      return undefined;
    }
    event.preventDefault();

    // Where the card will sit: the card now at that place, or the end of the column.
    const id = Number(active);
    const target = columnsRef.current[stage].filter((x) => x !== id);
    const rects = context.droppableRects;
    const slot = target[index] !== undefined ? rects.get(target[index]) : undefined;
    const last = target.length ? rects.get(target[target.length - 1]) : undefined;
    const columnRect = rects.get(`${COLUMN_PREFIX}${stage}`);
    const point = slot
      ? { x: slot.left, y: slot.top }
      : last
        ? { x: last.left, y: last.bottom + 9 }
        : columnRect
          ? { x: columnRect.left + 2, y: columnRect.top }
          : undefined;
    if (!point) return undefined;

    keyboardAt.current = { stage, index };
    target.splice(index, 0, id);
    setDragging((prev) => (prev ? { ...prev, [at.stage]: prev[at.stage].filter((x) => x !== id), [stage]: target } : prev));
    return point;
  };

  const sensors = useSensors(
    // A small move starts a drag, so a plain click still opens the deal.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
      // Space picks up and drops; Enter is left to open the deal page.
      keyboardCodes: { start: [KeyboardCode.Space], end: [KeyboardCode.Space], cancel: [KeyboardCode.Esc] },
    }),
  );

  const findStage = (id: UniqueIdentifier, cols: Columns): Stage | undefined => {
    if (typeof id === "string" && id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length) as Stage;
    return STAGES.find((s) => cols[s.id].includes(Number(id)))?.id;
  };

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const id = Number(active.id);
    const stage = findStage(id, settled)!;
    origin.current = { stage, index: settled[stage].indexOf(id) };
    keyboardAt.current = activatorEvent instanceof KeyboardEvent ? { ...origin.current } : null;
    setActiveId(id);
    setDragging(settled);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    // Keyboard moves place the card themselves.
    if (!over || keyboardAt.current) return;
    setDragging((prev) => {
      if (!prev) return prev;
      const from = findStage(active.id, prev);
      const to = findStage(over.id, prev);
      if (!from || !to || from === to) return prev;
      const id = Number(active.id);
      const target = prev[to].filter((x) => x !== id);
      let index = target.length;
      if (!(typeof over.id === "string")) {
        const overIndex = target.indexOf(Number(over.id));
        const activeTop = active.rect.current.translated?.top ?? 0;
        const below = activeTop > over.rect.top + over.rect.height / 2;
        index = overIndex < 0 ? target.length : overIndex + (below ? 1 : 0);
      }
      target.splice(index, 0, id);
      return { ...prev, [from]: prev[from].filter((x) => x !== id), [to]: target };
    });
  };

  const finish = () => {
    setDragging(null);
    setActiveId(null);
    origin.current = null;
    keyboardAt.current = null;
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const cols = dragging;
    const start = origin.current;
    const keyboard = keyboardAt.current;
    finish();
    if (keyboard && start) {
      if (keyboard.stage !== start.stage || keyboard.index !== start.index) move({ id: Number(active.id), ...keyboard });
      return;
    }
    if (!over || !cols || !start) return;
    const id = Number(active.id);
    const stage = findStage(active.id, cols);
    if (!stage) return;
    let order = cols[stage];
    if (typeof over.id !== "string") {
      const overIndex = order.indexOf(Number(over.id));
      if (overIndex >= 0) order = arrayMove(order, order.indexOf(id), overIndex);
    }
    const index = order.indexOf(id);
    if (stage === start.stage && index === start.index) return;
    move({ id, stage, index });
  };

  const active = activeId !== null ? byId.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={finish}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{
        screenReaderInstructions: {
          draggable: "To move a deal, press Space to pick it up, the arrow keys to move it, and Space again to drop it. Press Escape to cancel. Press Enter to open it.",
        },
        announcements: {
          onDragStart: ({ active: a }) => `Picked up ${byId.get(Number(a.id))?.name}.`,
          onDragOver: ({ active: a }) => {
            const stage = findStage(a.id, columnsRef.current);
            return stage ? `${byId.get(Number(a.id))?.name} is in ${STAGE_BY_ID[stage].label}, place ${columnsRef.current[stage].indexOf(Number(a.id)) + 1}.` : undefined;
          },
          onDragEnd: ({ active: a, over }) =>
            over ? `${byId.get(Number(a.id))?.name} was dropped.` : "Move cancelled.",
          onDragCancel: () => "Move cancelled.",
        },
      }}
    >
      <div className="board">
        {STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            deals={columns[stage.id].map((id) => byId.get(id)!).filter(Boolean)}
            onAdd={() => openDealForm({ defaults: { stage: stage.id } })}
          />
        ))}
      </div>
      <DragOverlay>
        {active && (
          <div className={`card lifted${active.is_late ? " late" : ""}`}>
            <CardBody deal={active} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
