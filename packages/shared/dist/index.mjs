// src/types.ts
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
export {
  RoomState,
  VERSION
};
