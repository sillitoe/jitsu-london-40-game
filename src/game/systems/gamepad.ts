import type { PromptInput } from "../types";

type GamepadAction = PromptInput | "SPECIAL" | "START";
const heldByController = new Map<number, Set<GamepadAction>>();
const directionDeadzone = 0.55;

export function readGamepadPresses(): Set<GamepadAction> {
  const presses = new Set<GamepadAction>();
  const connected = new Set<number>();

  for (const pad of navigator.getGamepads?.() ?? []) {
    if (!pad?.connected || pad.mapping !== "standard") continue;

    const held = new Set<GamepadAction>();
    const [x = 0, y = 0] = pad.axes;
    const horizontal = Math.abs(x) >= Math.abs(y);
    if (pad.buttons[14]?.pressed || (horizontal && x < -directionDeadzone)) held.add("LEFT");
    if (pad.buttons[15]?.pressed || (horizontal && x > directionDeadzone)) held.add("RIGHT");
    if (pad.buttons[13]?.pressed || (!horizontal && y > directionDeadzone)) held.add("DOWN");
    if (pad.buttons[0]?.pressed) held.add("X");
    if (pad.buttons[1]?.pressed) held.add("SPECIAL");
    if (pad.buttons[9]?.pressed) held.add("START");

    const previous = heldByController.get(pad.index);
    for (const action of held) {
      if (!previous?.has(action)) presses.add(action);
    }
    heldByController.set(pad.index, held);
    connected.add(pad.index);
  }

  for (const index of heldByController.keys()) {
    if (!connected.has(index)) heldByController.delete(index);
  }
  return presses;
}
