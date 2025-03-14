import type { Device } from "@core/stores/deviceStore.ts";
import { MeshDevice, Protobuf } from "@meshtastic/core";

export const subscribeAll = (
  device: Device,
  connection: MeshDevice,
) => {
  // Set device as a global variable for debugging
  let myNodeNum = 0;

  // onLogEvent
  // onMeshHeartbeat

  connection.events.onDeviceMetadataPacket.subscribe((metadataPacket) => {
    device.addMetadata(metadataPacket.from, metadataPacket.data);
  });

  connection.events.onRoutingPacket.subscribe((routingPacket) => {
    switch (routingPacket.data.variant.case) {
      case "errorReason": {
        if (
          routingPacket.data.variant.value === Protobuf.Mesh.Routing_Error.NONE
        ) {
          return;
        }
        console.log(`Routing Error: ${routingPacket.data.variant.value}`);
        break;
      }
      case "routeReply": {
        console.log(`Route Reply: ${routingPacket.data.variant.value}`);
        break;
      }
      case "routeRequest": {
        console.log(`Route Request: ${routingPacket.data.variant.value}`);
        break;
      }
    }
  });

  connection.events.onTelemetryPacket.subscribe(() => {
    // device.setMetrics(telemetryPacket);
  });

  connection.events.onDeviceStatus.subscribe((status) => {
    device.setStatus(status);
  });

  connection.events.onWaypointPacket.subscribe((waypoint) => {
    const { data } = waypoint;
    device.addWaypoint(data);
  });

  connection.events.onMyNodeInfo.subscribe((nodeInfo) => {
    device.setHardware(nodeInfo);
    myNodeNum = nodeInfo.myNodeNum;
  });

  connection.events.onUserPacket.subscribe((user) => {
    device.addUser(user);
  });

  connection.events.onPositionPacket.subscribe((position) => {
    device.addPosition(position);
  });

  connection.events.onNodeInfoPacket.subscribe((nodeInfo) => {
    // toast(`New Node Discovered: ${nodeInfo.user?.shortName ?? "UNK"}`, {
    //   icon: "🔎"
    // });
    device.addNodeInfo(nodeInfo);
  });

  connection.events.onChannelPacket.subscribe((channel) => {
    console.log('channel', channel);

    device.addChannel(channel);
  });
  connection.events.onConfigPacket.subscribe((config) => {
    device.setConfig(config);
  });
  connection.events.onModuleConfigPacket.subscribe((moduleConfig) => {
    device.setModuleConfig(moduleConfig);
  });

  connection.events.onMessagePacket.subscribe((messagePacket) => {

    console.log('messagePacket', messagePacket);

    device.addMessage({
      ...messagePacket,
      state: messagePacket.from !== myNodeNum ? "ack" : "waiting",
    });
  });

  connection.events.onTraceRoutePacket.subscribe((traceRoutePacket) => {
    console.log("Trace Route Packet", traceRoutePacket);
    device.addTraceRoute({
      ...traceRoutePacket,
    });
  });

  connection.events.onPendingSettingsChange.subscribe((state) => {
    device.setPendingSettingsChanges(state);
  });

  connection.events.onMeshPacket.subscribe((meshPacket) => {
    device.processPacket({
      from: meshPacket.from,
      snr: meshPacket.rxSnr,
      time: meshPacket.rxTime,
    });
  });

  connection.events.onQueueStatus.subscribe((queueStatus) => {
    device.setQueueStatus(queueStatus);
    if (queueStatus.free < 10) {
      // start queueing messages
    }
  });
  
  connection.events.onNeighborInfoPacket.subscribe((neighborInfo) => {
    device.setNeighborInfo(neighborInfo.from, neighborInfo.data);
  });
};
