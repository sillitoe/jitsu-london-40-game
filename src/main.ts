import Phaser from "phaser";
import { requirePrototypeAuth } from "./authGate";
import { gameConfig } from "./game/config";

import "./style.css";

if (await requirePrototypeAuth()) {
  new Phaser.Game(gameConfig);
}
