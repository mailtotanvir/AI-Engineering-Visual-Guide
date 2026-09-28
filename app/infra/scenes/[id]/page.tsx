import { notFound } from "next/navigation";
import InfraShell from "@/components/infra/InfraShell";
import {
  NvlinkTopology,
  PcieCxlBottleneck,
  HbmMemoryWall,
  HgxNodeAnatomy,
  InfinibandVsRoce,
  FatTreeRailOptimized,
  RingVsTreeAllreduce,
  IncastAdaptiveRouting,
  GpudirectStorage,
  DalyCheckpointOpt,
  DataIngestStreaming,
  CheckpointResumeMttr,
} from "@/components/infra/scenes";
import {
  GangSchedulingKueue,
  TopologyAwarePlacement,
  StragglerDetection,
  MigHardwareSlicing,
  SilentDataCorruption,
  RackPowerLiquidCooling,
  PredictiveNodeDrain,
  PueCarbonGrid,
  MfuVsMbuAccounting,
  ClusterTcoModeling,
  TokenCostUnitEconomics,
  SpotInterruptionArbitrage,
} from "@/components/infra/scenesB";
import { INFRA_JOURNEY } from "@/content/infra/journey";

export function generateStaticParams() {
  return INFRA_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "nvlink-topology": <NvlinkTopology />,
  "pcie-cxl-bottleneck": <PcieCxlBottleneck />,
  "hbm-memory-wall": <HbmMemoryWall />,
  "hgx-node-anatomy": <HgxNodeAnatomy />,
  "infiniband-vs-roce": <InfinibandVsRoce />,
  "fat-tree-rail-optimized": <FatTreeRailOptimized />,
  "ring-vs-tree-allreduce": <RingVsTreeAllreduce />,
  "incast-adaptive-routing": <IncastAdaptiveRouting />,
  "gpudirect-storage": <GpudirectStorage />,
  "daly-checkpoint-opt": <DalyCheckpointOpt />,
  "data-ingest-streaming": <DataIngestStreaming />,
  "checkpoint-resume-mttr": <CheckpointResumeMttr />,
  "gang-scheduling-kueue": <GangSchedulingKueue />,
  "topology-aware-placement": <TopologyAwarePlacement />,
  "straggler-detection": <StragglerDetection />,
  "mig-hardware-slicing": <MigHardwareSlicing />,
  "silent-data-corruption": <SilentDataCorruption />,
  "rack-power-liquid-cooling": <RackPowerLiquidCooling />,
  "predictive-node-drain": <PredictiveNodeDrain />,
  "pue-carbon-grid": <PueCarbonGrid />,
  "mfu-vs-mbu-accounting": <MfuVsMbuAccounting />,
  "cluster-tco-modeling": <ClusterTcoModeling />,
  "token-cost-unit-economics": <TokenCostUnitEconomics />,
  "spot-interruption-arbitrage": <SpotInterruptionArbitrage />,
};

export default function Page({ params }: { params: { id: string } }) {
  const entry = INFRA_JOURNEY.find((j) => j.id === params.id);
  if (!entry || !SCENES[params.id]) notFound();
  return (
    <main>
      <InfraShell id={params.id}>{SCENES[params.id]}</InfraShell>
    </main>
  );
}
