import fs from "node:fs";
import path from "node:path";

const workboardPath = path.resolve("program/AGENT_WORKBOARD.json");

function loadBoard() {
  return JSON.parse(fs.readFileSync(workboardPath, "utf8"));
}

function saveBoard(board) {
  fs.writeFileSync(workboardPath, JSON.stringify(board, null, 2) + "\n");
}

function now() {
  return new Date().toISOString();
}

function status() {
  const board = loadBoard();
  const rows = board.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    owner: task.owner || "-",
    scope: task.scope
  }));
  console.table(rows);
}

function claim(agentId, taskId) {
  if (!agentId || !taskId) {
    throw new Error("Usage: pnpm task:claim <AGENT_ID> <TASK_ID>");
  }

  const board = loadBoard();
  const task = board.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found.`);
  }

  if (task.status === "done") {
    throw new Error(`Task ${taskId} is already done.`);
  }

  if (task.owner && task.owner !== agentId) {
    throw new Error(`Task ${taskId} is already owned by ${task.owner}.`);
  }

  task.owner = agentId;
  task.status = "in_progress";
  task.updatedAt = now();
  board.updatedAt = now();
  saveBoard(board);
  console.log(`Claimed ${taskId} for ${agentId}`);
}

function release(agentId, taskId, result = "done") {
  if (!agentId || !taskId) {
    throw new Error("Usage: pnpm task:release <AGENT_ID> <TASK_ID> [done|blocked|pending]");
  }

  const board = loadBoard();
  const task = board.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found.`);
  }

  if (task.owner !== agentId) {
    throw new Error(`Task ${taskId} is owned by ${task.owner || "nobody"}, not ${agentId}.`);
  }

  task.status = result;
  task.owner = result === "done" ? null : agentId;
  task.updatedAt = now();
  board.updatedAt = now();
  saveBoard(board);
  console.log(`Released ${taskId} as ${result}`);
}

const [command, agentId, taskId, result] = process.argv.slice(2);

try {
  if (command === "status") {
    status();
  } else if (command === "claim") {
    claim(agentId, taskId);
  } else if (command === "release") {
    release(agentId, taskId, result);
  } else {
    throw new Error("Usage: pnpm task:status | pnpm task:claim <AGENT_ID> <TASK_ID> | pnpm task:release <AGENT_ID> <TASK_ID> [done|blocked|pending]");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

