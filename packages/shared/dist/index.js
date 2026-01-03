"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AVATAR_MODELS: () => AVATAR_MODELS,
  RoomState: () => RoomState,
  VERSION: () => VERSION
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var AVATAR_MODELS = [
  { id: "player.glb", name: "Default Player" },
  { id: "tralalero.glb", name: "Tralalero" }
];
var RoomState = /* @__PURE__ */ ((RoomState2) => {
  RoomState2["LOBBY"] = "LOBBY";
  RoomState2["PRE_ROUND"] = "PRE_ROUND";
  RoomState2["PLAYING"] = "PLAYING";
  RoomState2["POST_ROUND"] = "POST_ROUND";
  RoomState2["GAME_OVER"] = "GAME_OVER";
  return RoomState2;
})(RoomState || {});

// src/index.ts
var VERSION = "0.0.1";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AVATAR_MODELS,
  RoomState,
  VERSION
});
