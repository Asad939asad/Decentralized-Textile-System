/**
 * TextileNexusPro — Contract Bridge
 * 
 * Every external function in the contract is wrapped here.
 * Uses viem v2 (already in your project's devDependencies).
 * 
 * USAGE:
 *   import { createWalletClient, createPublicClient, custom, http } from "viem";
 *   import { hardhat } from "viem/chains";
 *   import { TextileBridge } from "./contractBridge";
 *
 *   // Read-only client (no wallet needed)
 *   const publicClient = createPublicClient({ chain: hardhat, transport: http() });
 *
 *   // Write client (needs a wallet — MetaMask via window.ethereum, or a private key)
 *   const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });
 *   const [account] = await walletClient.getAddresses();
 *
 *   const bridge = new TextileBridge(publicClient, walletClient, account);
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
} from "viem";
import { hardhat } from "viem/chains";
import { TEXTILE_NEXUS_ABI } from "./abi.js";

// ─── Deployed Addresses (localhost) ─────────────────────────────────────────
export const CONTRACT_ADDRESSES = {
  TextileLogic: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address,
  TextileNexusPro: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address,
};

// ─── Enum mirrors (match Solidity order exactly) ─────────────────────────────
export enum ActorRole { None, Farmer, Vendor, QualityInspector, DepartmentHead, LogisticsAgent, FinanceOfficer, RetailOutlet, OnlineStore, Auditor }
export enum FiberType { Cotton, Wool, Silk, Linen, Synthetic, Blended }
export enum QualityGrade { Rejected, Standard, Premium, Luxury }
export enum Department { Sourcing, Spinning, Weaving, Dyeing, Cutting, Stitching, Finishing, QualityControl, Packaging, Dispatch }
export enum BatchStatus { Created, InSpinning, InWeaving, InDyeing, InCutting, InStitching, InFinishing, QCPending, QCApproved, QCRejected, InPackaging, ReadyForDispatch, Dispatched, InTransit, DeliveredToOutlet, Recalled }
export enum DispatchType { InternalTransfer, OutboundShipment, ReturnShipment, RecallShipment }
export enum TransitStatus { NotStarted, Preparing, AwaitingConsensus, Dispatched, InTransit, ArrivedAtHub, OutForDelivery, Delivered, Failed, Returned }
export enum OutletType { PhysicalStore, OnlineStore, PopupStore, Wholesale }


// ─── Input Types ──────────────────────────────────────────────────────────────
export interface BatchParams {
  batchCode: string;
  productName: string;
  productDescription: string;
  rawMaterialIds: bigint[];
  quantityUnits: bigint;
  retailPrice: bigint;
}

export interface DispatchParams {
  batchId: bigint;
  destinationCustodian: Address;
  dispatchType: DispatchType;
  originLocation: string;
  destinationLocation: string;
  courierName: string;
  estimatedDelivery: bigint;
  shippingCost: bigint;
}

// ─── Helper: create pre-configured clients for localhost ─────────────────────
export function createLocalhostClients() {
  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });
  return { publicClient };
}

/** Call this in a browser environment where window.ethereum is available */
declare const window: any;
export async function createBrowserClients() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed. Please install a Web3 wallet extension to connect.');
  }

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletClient = createWalletClient({
    chain: hardhat,
    transport: custom((window as any).ethereum),
  });
  
  // Actually request connection from MetaMask (triggers the popup)
  const [account] = await walletClient.requestAddresses();
  
  return { publicClient, walletClient, account };
}

export async function createLocalClients(address: string) {
  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });
  
  const walletClient = createWalletClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
    account: address as any,
  });
  
  return { publicClient, walletClient, account: address as any };
}

// ─── Main Bridge Class ────────────────────────────────────────────────────────
export class TextileBridge {
  private pub: PublicClient;
  private wallet?: WalletClient;
  private account?: Address;
  private addr = CONTRACT_ADDRESSES.TextileNexusPro;

  constructor(publicClient: PublicClient, walletClient?: WalletClient, account?: Address) {
    this.pub = publicClient;
    this.wallet = walletClient;
    this.account = account;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────
  private read<T>(functionName: string, args?: readonly unknown[]) {
    return this.pub.readContract({
      address: this.addr,
      abi: TEXTILE_NEXUS_ABI,
      functionName: functionName as never,
      args: args as never,
    }) as Promise<T>;
  }

  private async write(functionName: string, args?: readonly unknown[]): Promise<Hash> {
    if (!this.wallet || !this.account) throw new Error("No wallet connected. Pass walletClient + account to constructor.");
    const { request } = await this.pub.simulateContract({
      address: this.addr,
      abi: TEXTILE_NEXUS_ABI,
      functionName: functionName as never,
      args: args as never,
      account: this.account,
    });
    return this.wallet.writeContract(request as never);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMIN & SETUP
  // ══════════════════════════════════════════════════════════════════════════

  /** Register any supply chain actor (onlyAdmin) */
  registerActor(wallet: Address, role: ActorRole, name: string, location: string): Promise<Hash> {
    return this.write("registerActor", [wallet, role, name, location]);
  }

  /** Register a retail outlet or online store (onlyAdmin) */
  registerRetailOutlet(wallet: Address, role: ActorRole, storeName: string, location: string, outletType: OutletType, platformURL: string): Promise<Hash> {
    return this.write("registerRetailOutlet", [wallet, role, storeName, location, outletType, platformURL]);
  }

  /** Assign/reassign a department head (onlyAdmin) */
  setDepartmentHead(dept: Department, head: Address): Promise<Hash> {
    return this.write("setDepartmentHead", [dept, head]);
  }

  /** Soft-ban an actor — sets isActive=false (onlyAdmin) */
  deactivateActor(wallet: Address): Promise<Hash> {
    return this.write("deactivateActor", [wallet]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RAW MATERIAL SOURCING
  // ══════════════════════════════════════════════════════════════════════════

  /** Log a new raw material on-chain (Farmer / Vendor) */
  sourceMaterial(fiberType: FiberType, originFarm: string, weightKg: bigint, pricePerKg: bigint, harvestDate: bigint, certifications: string): Promise<Hash> {
    return this.write("sourceMaterial", [fiberType, originFarm, weightKg, pricePerKg, harvestDate, certifications]);
  }

  /** Approve a raw material and assign quality grade (QualityInspector) */
  approveMaterialQuality(materialId: bigint, grade: QualityGrade): Promise<Hash> {
    return this.write("approveMaterialQuality", [materialId, grade]);
  }

  /** Reject a raw material with a reason (QualityInspector) */
  rejectMaterialQuality(materialId: bigint, reason: string): Promise<Hash> {
    return this.write("rejectMaterialQuality", [materialId, reason]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRODUCTION BATCH
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a production batch by consuming QC-approved materials (DepartmentHead) */
  createBatch(params: BatchParams): Promise<Hash> {
    return this.write("createBatch", [params]);
  }

  /** Move a batch to the next department in the pipeline (DepartmentHead) */
  moveBatchToDepartment(batchId: bigint, targetDept: Department, costToAdd: bigint, notes: string): Promise<Hash> {
    return this.write("moveBatchToDepartment", [batchId, targetDept, costToAdd, notes]);
  }

  /** Approve a batch at the QC stage (QualityInspector) */
  approveQC(batchId: bigint, notes: string): Promise<Hash> {
    return this.write("approveQC", [batchId, notes]);
  }

  /** Reject a batch at the QC stage (QualityInspector) */
  rejectQC(batchId: bigint, reason: string): Promise<Hash> {
    return this.write("rejectQC", [batchId, reason]);
  }

  /** Re-queue a QC-rejected batch back to QC pending (DepartmentHead) */
  resubmitAfterQCRejection(batchId: bigint, remediationNotes: string): Promise<Hash> {
    return this.write("resubmitAfterQCRejection", [batchId, remediationNotes]);
  }

  /** Finalize a batch for dispatch, locking in the retail price (DepartmentHead) */
  markReadyForDispatch(batchId: bigint, finalRetailPrice: bigint): Promise<Hash> {
    return this.write("markReadyForDispatch", [batchId, finalRetailPrice]);
  }

  /** Recall a defective batch (onlyAdmin) */
  initiateRecall(batchId: bigint, reason: string): Promise<Hash> {
    return this.write("initiateRecall", [batchId, reason]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DISPATCH & LOGISTICS
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a dispatch order for a ready batch (LogisticsAgent) */
  createDispatchOrder(params: DispatchParams): Promise<Hash> {
    return this.write("createDispatchOrder", [params]);
  }

  /** Origin dept head confirms dispatch (DepartmentHead) */
  confirmDispatch_Origin(orderId: bigint): Promise<Hash> {
    return this.write("confirmDispatch_Origin", [orderId]);
  }

  /** Logistics agent confirms + provides tracking number (LogisticsAgent) */
  confirmDispatch_Logistics(orderId: bigint, trackingNumber: string): Promise<Hash> {
    return this.write("confirmDispatch_Logistics", [orderId, trackingNumber]);
  }

  /** Finance officer confirms the dispatch (FinanceOfficer) */
  confirmDispatch_Finance(orderId: bigint): Promise<Hash> {
    return this.write("confirmDispatch_Finance", [orderId]);
  }

  /** Log a real-time transit checkpoint (LogisticsAgent) */
  addTransitCheckpoint(orderId: bigint, location: string, newStatus: TransitStatus, statusNote: string): Promise<Hash> {
    return this.write("addTransitCheckpoint", [orderId, location, newStatus, statusNote]);
  }

  /** Mark a dispatch as failed mid-transit (LogisticsAgent) */
  markDispatchFailed(orderId: bigint, reason: string): Promise<Hash> {
    return this.write("markDispatchFailed", [orderId, reason]);
  }

  /** Receiving party confirms delivery (RetailOutlet / OnlineStore / DepartmentHead) */
  confirmReceipt(orderId: bigint, deliveryNotes: string): Promise<Hash> {
    return this.write("confirmReceipt", [orderId, deliveryNotes]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GOVERNANCE
  // ══════════════════════════════════════════════════════════════════════════

  /** Create an on-chain governance proposal (Council member) */
  proposeGovernanceAction(proposalHash: `0x${string}`): Promise<Hash> {
    return this.write("proposeGovernanceAction", [proposalHash]);
  }

  /** Vote to approve an existing proposal (Council member) */
  approveProposal(pid: bigint): Promise<Hash> {
    return this.write("approveProposal", [pid]);
  }

  /** Check if a proposal has reached the approval threshold (read-only) */
  isProposalApproved(pid: bigint): Promise<boolean> {
    return this.read<boolean>("isProposalApproved", [pid]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VIEW / QUERY FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════

  /** Full chain-of-custody history for a batch */
  getBatchOwnershipHistory(batchId: bigint) {
    return this.read<{ owner: Address; ownerName: string; transferredAt: bigint; transferReason: string; statusAtTransfer: number }[]>("getBatchOwnershipHistory", [batchId]);
  }

  /** All department processing logs for a batch */
  getBatchDeptLogs(batchId: bigint) {
    return this.read<{ dept: number; processedBy: Address; enteredAt: bigint; exitedAt: bigint; costAdded: bigint; notes: string; approved: boolean }[]>("getBatchDeptLogs", [batchId]);
  }

  /** Real-time transit checkpoint history for a dispatch order */
  getTransitCheckpoints(orderId: bigint) {
    return this.read<{ orderId: bigint; location: string; timestamp: bigint; statusNote: string; updatedBy: Address }[]>("getTransitCheckpoints", [orderId]);
  }

  /** Raw material IDs consumed in a batch */
  getBatchMaterials(batchId: bigint): Promise<readonly bigint[]> {
    return this.read<readonly bigint[]>("getBatchMaterials", [batchId]);
  }

  /** Per-party dispatch confirmation status */
  getDispatchConsensus(orderId: bigint): Promise<{ origin: boolean; logistics: boolean; finance: boolean; destination: boolean; fullyConfirmed: boolean }> {
    return this.read("getDispatchConsensus", [orderId]);
  }

  /** Addresses of all four dispatch signers */
  getDispatchSigners(orderId: bigint): Promise<{ originSigner: Address; logisticsSigner: Address; financeSigner: Address; destinationSigner: Address }> {
    return this.read("getDispatchSigners", [orderId]);
  }

  /** Full cost breakdown and profit margin for a batch */
  getBatchCostBreakdown(batchId: bigint): Promise<{ rawMaterialCost: bigint; productionCost: bigint; finalCost: bigint; retailPrice: bigint; margin: bigint }> {
    return this.read("getBatchCostBreakdown", [batchId]);
  }

  /** Total number of registered actors */
  getActorCount(): Promise<bigint> {
    return this.read<bigint>("getActorCount");
  }

  /** Number of governance council members */
  getCouncilSize(): Promise<bigint> {
    return this.read<bigint>("getCouncilSize");
  }

  /** Check if a wallet holds a specific active role */
  hasRole(wallet: Address, role: ActorRole): Promise<boolean> {
    return this.read<boolean>("hasRole", [wallet, role]);
  }

  /** Units of a batch held in an outlet's inventory */
  getOutletInventory(outlet: Address, batchId: bigint): Promise<bigint> {
    return this.read<bigint>("getOutletInventory", [outlet, batchId]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PUBLIC STATE GETTERS (auto-generated by Solidity)
  // ══════════════════════════════════════════════════════════════════════════

  admin(): Promise<Address> { return this.read<Address>("admin"); }
  proposalCount(): Promise<bigint> { return this.read<bigint>("proposalCount"); }
  governanceThreshold(): Promise<bigint> { return this.read<bigint>("governanceThreshold"); }
  materialCount(): Promise<bigint> { return this.read<bigint>("materialCount"); }
  batchCount(): Promise<bigint> { return this.read<bigint>("batchCount"); }
  dispatchCount(): Promise<bigint> { return this.read<bigint>("dispatchCount"); }
  departmentsInitialized(): Promise<boolean> { return this.read<boolean>("departmentsInitialized"); }
  isCouncilMember(addr: Address): Promise<boolean> { return this.read<boolean>("isCouncilMember", [addr]); }

  /** Get full Actor struct for any wallet */
  actors(wallet: Address) {
    return this.read<{ wallet: Address; role: number; name: string; location: string; isActive: boolean; registeredAt: bigint; totalTransactions: bigint; reputationScore: bigint }>("actors", [wallet]);
  }

  /** Get full RawMaterial struct by ID */
  rawMaterials(materialId: bigint) {
    return this.read<{ materialId: bigint; fiberType: number; originFarm: string; suppliedBy: Address; weightKg: bigint; pricePerKg: bigint; totalCost: bigint; grade: number; qualityApproved: boolean; approvedBy: Address; harvestDate: bigint; receivedAt: bigint; certifications: string; isConsumed: boolean }>("rawMaterials", [materialId]);
  }

  /** Get full ProductionBatch struct by ID */
  batches(batchId: bigint) {
    return this.read<{ batchId: bigint; batchCode: string; productName: string; productDescription: string; primaryFiber: number; quantityUnits: bigint; totalWeightKg: bigint; rawMaterialCost: bigint; productionCost: bigint; finalCost: bigint; retailPrice: bigint; status: number; currentDept: number; currentCustodian: Address; isFinished: boolean; isRecalled: boolean; createdAt: bigint; lastUpdatedAt: bigint; qcNotes: string; qcInspector: Address }>("batches", [batchId]);
  }

  /** Get full DispatchOrder struct by ID */
  dispatchOrders(orderId: bigint) {
    return this.read<{ orderId: bigint; batchId: bigint; dispatchType: number; originCustodian: Address; destinationCustodian: Address; originLocation: string; destinationLocation: string; courierName: string; trackingNumber: string; estimatedDelivery: bigint; actualDelivery: bigint; transitStatus: number; shippingCost: bigint; createdAt: bigint; dispatchedAt: bigint; originConfirmed: boolean; logisticsConfirmed: boolean; financeConfirmed: boolean; destinationConfirmed: boolean; originSigner: Address; logisticsSigner: Address; financeSigner: Address; destinationSigner: Address; deliveryNotes: string }>("dispatchOrders", [orderId]);
  }

  /** Get DepartmentRecord by Department enum value */
  departments(dept: Department) {
    return this.read<{ dept: number; deptName: string; deptHead: Address; isOperational: boolean; batchesProcessed: bigint }>("departments", [dept]);
  }
}
