// Minimal Node transport + helpers for the ZMK Studio RPC over a CDC-ACM serial port.
import { SerialPort } from "serialport";
import { Readable, Writable } from "node:stream";
import { create_rpc_connection, call_rpc } from "@zmkfirmware/zmk-studio-ts-client";

export async function connect(path = "/dev/ttyACM0") {
  const port = new SerialPort({ path, baudRate: 115200, autoOpen: false });
  await new Promise((res, rej) => port.open((e) => (e ? rej(e) : res())));
  const abortController = new AbortController();
  const transport = {
    label: path,
    abortController,
    readable: Readable.toWeb(port),
    writable: Writable.toWeb(port),
  };
  const conn = create_rpc_connection(transport, { signal: abortController.signal });
  const close = () => new Promise((res) => port.close(() => res()));
  return { conn, close };
}

export const rpc = (conn, req) => call_rpc(conn, req);

export async function deviceInfo(conn) {
  const r = await rpc(conn, { core: { getDeviceInfo: true } });
  const d = r.core.getDeviceInfo;
  return { name: d.name, serial: Buffer.from(d.serialNumber).toString("hex") };
}
export async function lockState(conn) {
  return (await rpc(conn, { core: { getLockState: true } })).core.getLockState; // 0 unknown? see enum
}
export async function behaviors(conn) {
  const ids = (await rpc(conn, { behaviors: { listAllBehaviors: true } })).behaviors.listAllBehaviors.behaviors;
  const out = {};
  for (const id of ids) {
    const d = (await rpc(conn, { behaviors: { getBehaviorDetails: { behaviorId: id } } })).behaviors.getBehaviorDetails;
    out[d.displayName] = { id, metadata: d.metadata };
  }
  return out;
}
export async function keymap(conn) {
  return (await rpc(conn, { keymap: { getKeymap: true } })).keymap.getKeymap;
}
export async function physicalLayouts(conn) {
  return (await rpc(conn, { keymap: { getPhysicalLayouts: true } })).keymap.getPhysicalLayouts;
}
export async function setBinding(conn, layerId, keyPosition, behaviorId, param1 = 0, param2 = 0) {
  const r = await rpc(conn, { keymap: { setLayerBinding: { layerId, keyPosition, binding: { behaviorId, param1, param2 } } } });
  return r.keymap.setLayerBinding; // enum SetLayerBindingResponse
}
export async function setLayerName(conn, layerId, name) {
  return (await rpc(conn, { keymap: { setLayerProps: { layerId, name } } })).keymap.setLayerProps;
}
export async function save(conn) {
  return (await rpc(conn, { keymap: { saveChanges: true } })).keymap.saveChanges;
}
export async function discard(conn) {
  return (await rpc(conn, { keymap: { discardChanges: true } })).keymap.discardChanges;
}
// "Restore stock settings": drops the Studio-saved keymap/layout so the compiled keymap applies. Needs unlock. Leaves BLE bonds alone.
export async function resetSettings(conn) {
  return (await rpc(conn, { core: { resetSettings: true } })).core.resetSettings; // boolean
}
