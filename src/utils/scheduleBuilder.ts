import { TaskInput, ScheduleBlock, LunchBreakConfig, BlockType } from '../types';

let _blockIdCounter = 0;
const makeId = (): string => `block-${++_blockIdCounter}`;

/**
 * Builds the ordered schedule from tasks and lunch break configuration.
 *
 * Break rules:
 *  - After every 3rd cumulative work block → 25-min LONG BREAK
 *  - If this work block index matches lunchConfig.afterWorkBlock → LUNCH (replaces regular break)
 *  - Otherwise → SHORT BREAK (5 min after 25-min session, 10 min after 45-min session)
 *  - No break is added after the very last work block.
 */
export function buildSchedule(
  tasks: TaskInput[],
  lunchConfig: LunchBreakConfig,
): ScheduleBlock[] {
  _blockIdCounter = 0;
  const blocks: ScheduleBlock[] = [];
  let workBlockCount = 0;

  // Flatten into ordered work items first so we can detect "last block"
  const workItems: { task: TaskInput; sessionIndex: number }[] = [];
  for (const task of tasks) {
    for (let i = 0; i < task.sessionCount; i++) {
      workItems.push({ task, sessionIndex: i });
    }
  }

  workItems.forEach(({ task, sessionIndex }, idx) => {
    workBlockCount++;
    const isLastBlock = idx === workItems.length - 1;

    // Work block
    blocks.push({
      id: makeId(),
      type: 'work' as BlockType,
      taskId: task.id,
      taskName: task.name,
      sessionNumber: sessionIndex + 1,
      totalSessions: task.sessionCount,
      duration: task.sessionType === 'long' ? 45 : 25,
      completed: false,
      skipped: false,
      pauses: [],
    });

    if (!isLastBlock) {
      if (lunchConfig.enabled && workBlockCount === lunchConfig.afterWorkBlock) {
        // Lunch replaces the regular break at this slot
        blocks.push({
          id: makeId(),
          type: 'lunch' as BlockType,
          duration: lunchConfig.duration,
          completed: false,
          skipped: false,
          pauses: [],
        });
      } else if (workBlockCount % 3 === 0) {
        // Long break every 3 work blocks
        blocks.push({
          id: makeId(),
          type: 'long-break' as BlockType,
          duration: 25,
          completed: false,
          skipped: false,
          pauses: [],
        });
      } else {
        // Short break: 5 min after a 25-min session, 10 min after a 45-min session
        blocks.push({
          id: makeId(),
          type: 'short-break' as BlockType,
          duration: task.sessionType === 'short' ? 5 : 10,
          completed: false,
          skipped: false,
          pauses: [],
        });
      }
    }
  });

  return blocks;
}
